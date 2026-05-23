"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/get-user";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const Schema = z.object({
  amount_dollars: z.coerce.number().positive("Amount must be greater than 0").max(1_000_000),
  bucket_id: z.string().uuid("Pick a category"),
  subcategory_id: z.string().uuid().optional().nullable(),
  note: z.string().trim().max(280).optional().nullable(),
  occurred_at: z.string().optional().nullable(),
});

export type LogSpendState = { error?: string; fieldErrors?: Record<string, string> };

function dollarsToCents(d: number): number {
  return Math.round(d * 100);
}

export async function logSpendAction(
  _prev: LogSpendState,
  formData: FormData,
): Promise<LogSpendState> {
  const subRaw = formData.get("subcategory_id");
  const parsed = Schema.safeParse({
    amount_dollars: formData.get("amount_dollars"),
    bucket_id: formData.get("bucket_id"),
    // Empty string from the "(no sub)" tile → null.
    subcategory_id: subRaw && String(subRaw).length > 0 ? subRaw : null,
    note: formData.get("note") || null,
    occurred_at: formData.get("occurred_at") || null,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0]?.toString() ?? "form";
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return { fieldErrors };
  }

  await requireUser();
  const supabase = await createClient();
  const amountCents = dollarsToCents(parsed.data.amount_dollars);

  // log_spend RPC takes SELECT ... FOR UPDATE on the bucket row, serializing
  // concurrent spends so a race can't oversubtract. Sub is optional and
  // does NOT gate the balance — subs are goal/budget labels (the bucket is
  // the budget). Sub balance can go negative; that's intentional.
  const { error } = await supabase.rpc("log_spend", {
    p_bucket_id: parsed.data.bucket_id,
    p_subcategory_id: parsed.data.subcategory_id ?? null,
    p_amount_cents: amountCents,
    p_note: parsed.data.note ?? null,
    p_occurred_at: parsed.data.occurred_at || null,
  });

  if (error) {
    console.error("logSpendAction", error.message);
    const msg = error.message || "";
    if (/insufficient balance/i.test(msg)) {
      const m = msg.match(/in (\w+) bucket — has (\d+) cents, tried to spend (\d+) cents/);
      if (m) {
        const bucketKind = m[1];
        const have = (Number(m[2]) / 100).toFixed(2);
        const want = (Number(m[3]) / 100).toFixed(2);
        return {
          error: `Not enough in the ${bucketKind} bucket — has $${have}, tried to spend $${want}.`,
        };
      }
      return { error: "Not enough balance for that spend." };
    }
    if (/does not belong to bucket/i.test(msg)) {
      return { error: "That subcategory doesn't belong to the picked category." };
    }
    if (/is archived/i.test(msg)) {
      return { error: "That subcategory is archived." };
    }
    if (/bucket .* not found/i.test(msg)) {
      return { error: "Category not found." };
    }
    if (/subcategory .* not found/i.test(msg)) {
      return { error: "Subcategory not found." };
    }
    return { error: "Couldn't record the spend. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/activity");
  revalidatePath("/buckets/spend");
  revalidatePath("/buckets/save");
  revalidatePath("/buckets/share");
  redirect("/dashboard");
}
