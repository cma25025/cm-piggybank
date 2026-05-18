"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/get-user";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const Schema = z.object({
  amount_dollars: z.coerce.number().positive("Amount must be greater than 0").max(1_000_000),
  subcategory_id: z.string().uuid("Pick a subcategory"),
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
  const parsed = Schema.safeParse({
    amount_dollars: formData.get("amount_dollars"),
    subcategory_id: formData.get("subcategory_id"),
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

  // log_spend RPC takes SELECT ... FOR UPDATE on the subcategory row,
  // serializing concurrent spends so a race can't oversubtract.
  // RPC raises a friendly exception on archived sub / insufficient balance /
  // missing sub; we surface those messages directly.
  const { error } = await supabase.rpc("log_spend", {
    p_subcategory_id: parsed.data.subcategory_id,
    p_amount_cents: amountCents,
    p_note: parsed.data.note ?? null,
    p_occurred_at: parsed.data.occurred_at || null,
  });

  if (error) {
    console.error("logSpendAction", error.message);
    const msg = error.message || "";
    if (/insufficient balance/i.test(msg)) {
      // Format the cents in the RPC message back to dollars for the user.
      const m = msg.match(/in "([^"]+)" — has (\d+) cents, tried to spend (\d+) cents/);
      if (m) {
        const subName = m[1];
        const have = (Number(m[2]) / 100).toFixed(2);
        const want = (Number(m[3]) / 100).toFixed(2);
        return {
          error: `Not enough in "${subName}" — has $${have}, tried to spend $${want}.`,
        };
      }
      return { error: "Not enough balance for that spend." };
    }
    if (/is archived/i.test(msg)) {
      return { error: "That subcategory is archived." };
    }
    if (/not found/i.test(msg)) {
      return { error: "Subcategory not found." };
    }
    return { error: "Couldn't record the spend. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/activity");
  revalidatePath(`/buckets/spend`);
  revalidatePath(`/buckets/save`);
  revalidatePath(`/buckets/share`);
  redirect("/dashboard");
}
