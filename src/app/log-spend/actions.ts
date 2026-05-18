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

  // Look up the sub to find its bucket + piggybank, AND check balance for underflow.
  const { data: sub } = await supabase
    .from("subcategory")
    .select("id, display_name, bucket_id, piggybank_id, balance_cents, archived_at")
    .eq("id", parsed.data.subcategory_id)
    .maybeSingle();
  if (!sub) return { error: "Subcategory not found." };
  if (sub.archived_at) return { error: "That subcategory is archived." };

  const amountCents = dollarsToCents(parsed.data.amount_dollars);
  if ((sub.balance_cents ?? 0) < amountCents) {
    return {
      error: `Not enough in "${sub.display_name}" — has ${(sub.balance_cents ?? 0) / 100} ($), tried to spend ${amountCents / 100}.`,
    };
  }

  const { error } = await supabase.from("transaction").insert({
    piggybank_id: sub.piggybank_id,
    kind: "spend",
    amount_cents: amountCents,
    bucket_id: sub.bucket_id,
    subcategory_id: sub.id,
    note: parsed.data.note ?? null,
    occurred_at: parsed.data.occurred_at || new Date().toISOString(),
  });

  if (error) {
    console.error("logSpendAction", error.message);
    return { error: "Couldn't record the spend. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/activity");
  revalidatePath(`/buckets/spend`);
  revalidatePath(`/buckets/save`);
  revalidatePath(`/buckets/share`);
  redirect("/dashboard");
}
