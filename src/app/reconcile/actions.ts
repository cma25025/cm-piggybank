"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/get-user";
import { ReconcileSchema, reasonLabel } from "@/lib/reconcile/schemas";
import { revalidatePath } from "next/cache";

export type ReconcileState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
  diffCents?: number;
};

function dollarsToCents(d: number): number {
  return Math.round(d * 100);
}

export async function recordReconciliationAction(
  _prev: ReconcileState,
  formData: FormData,
): Promise<ReconcileState> {
  const parsed = ReconcileSchema.safeParse({
    actual_dollars: formData.get("actual_dollars"),
    reason: formData.get("reason"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  await requireUser();
  const supabase = await createClient();

  // Re-fetch the current total server-side — never trust a client-supplied
  // baseline (form could have sat open while another tab logged a spend).
  const { data: pb } = await supabase
    .from("piggybank")
    .select("id, total_balance_cents")
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (!pb) return { error: "No active piggybank." };

  const { data: spendBucket } = await supabase
    .from("bucket")
    .select("id")
    .eq("piggybank_id", pb.id)
    .eq("kind", "spend")
    .maybeSingle();
  if (!spendBucket) {
    // Schema invariant: every piggybank has all 3 buckets (created by the
    // create_piggybank_with_defaults RPC). Reaching here means data
    // corruption — throw so it surfaces in Vercel logs, don't show a
    // friendly toast that hides the bug.
    throw new Error(
      `Schema invariant violated: piggybank ${pb.id} has no Spend bucket`,
    );
  }

  const actualCents = dollarsToCents(parsed.data.actual_dollars);
  const diffCents = actualCents - (pb.total_balance_cents ?? 0);

  const label = reasonLabel(parsed.data.reason);
  const noteSuffix = parsed.data.note ? ` — ${parsed.data.note}` : "";
  const reconcileNote = `Reconciled: ${label}${noteSuffix}`;

  const { error } = await supabase.from("transaction").insert({
    piggybank_id: pb.id,
    kind: "adjustment",
    amount_cents: diffCents,
    bucket_id: spendBucket.id,
    note: reconcileNote,
  });

  if (error) {
    console.error("recordReconciliationAction", error.message);
    return { error: "Couldn't record the reconciliation. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/activity");
  revalidatePath("/buckets/spend");
  return { success: true, diffCents };
}
