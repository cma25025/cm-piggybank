"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/get-user";
import { revalidatePath } from "next/cache";

const Schema = z.object({
  transaction_id: z.string().uuid(),
  reason: z.string().trim().max(280).optional().nullable(),
});

export type VoidState = { error?: string; success?: boolean };

export async function voidTransactionAction(
  _prev: VoidState,
  formData: FormData,
): Promise<VoidState> {
  const parsed = Schema.safeParse({
    transaction_id: formData.get("transaction_id"),
    reason: formData.get("reason") || null,
  });
  if (!parsed.success) return { error: "Bad request." };

  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.rpc("void_transaction", {
    p_transaction_id: parsed.data.transaction_id,
    p_reason: parsed.data.reason || "caretaker void",
  });

  if (error) {
    console.error("voidTransactionAction", error.message);
    const msg = error.message || "";
    if (/already voided/i.test(msg)) return { error: "Already voided." };
    if (/cannot void an adjustment/i.test(msg)) {
      return { error: "Adjustments can't be voided directly. Void the original transaction instead." };
    }
    if (/not found/i.test(msg)) return { error: "Transaction not found." };
    return { error: "Couldn't void the transaction." };
  }

  revalidatePath("/activity");
  revalidatePath("/dashboard");
  revalidatePath("/buckets/spend");
  revalidatePath("/buckets/save");
  revalidatePath("/buckets/share");
  return { success: true };
}
