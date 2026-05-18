"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/get-user";
import { getOnboardingState } from "@/lib/onboarding/state";
import { redirect } from "next/navigation";

const FreshSchema = z.object({
  amount_dollars: z.coerce.number().positive("Amount must be greater than 0").max(1_000_000),
  funder_name: z.string().trim().min(1, "Funder is required").max(60),
  source_type: z.enum(["allowance", "birthday", "chores", "gift", "other"]),
  note: z.string().trim().max(280).optional().nullable(),
});

const MigrateSchema = z.object({
  spend_dollars: z.coerce.number().min(0).max(1_000_000),
  save_dollars: z.coerce.number().min(0).max(1_000_000),
  share_dollars: z.coerce.number().min(0).max(1_000_000),
});

export type Step4State = { error?: string; fieldErrors?: Record<string, string> };

function dollarsToCents(d: number): number {
  return Math.round(d * 100);
}

export async function submitFreshDepositAction(
  _prev: Step4State,
  formData: FormData,
): Promise<Step4State> {
  const parsed = FreshSchema.safeParse({
    amount_dollars: formData.get("amount_dollars"),
    funder_name: formData.get("funder_name"),
    source_type: formData.get("source_type"),
    note: formData.get("note") || null,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0]?.toString() ?? "form";
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return { fieldErrors };
  }

  const user = await requireUser();
  const state = await getOnboardingState(user.id);
  if (!state.piggybankId) redirect("/onboarding/step-1");

  const supabase = await createClient();
  const { error } = await supabase.rpc("add_deposit", {
    p_piggybank_id: state.piggybankId,
    p_amount_cents: dollarsToCents(parsed.data.amount_dollars),
    p_funder_name: parsed.data.funder_name,
    p_source_type: parsed.data.source_type,
    p_note: parsed.data.note ?? null,
  });

  if (error) {
    console.error("submitFreshDepositAction", error.message);
    return { error: "Couldn't record the deposit. Please try again." };
  }

  redirect("/dashboard");
}

export async function submitOpeningBalancesAction(
  _prev: Step4State,
  formData: FormData,
): Promise<Step4State> {
  const parsed = MigrateSchema.safeParse({
    spend_dollars: formData.get("spend_dollars"),
    save_dollars: formData.get("save_dollars"),
    share_dollars: formData.get("share_dollars"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0]?.toString() ?? "form";
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return { fieldErrors };
  }

  const total =
    parsed.data.spend_dollars + parsed.data.save_dollars + parsed.data.share_dollars;
  if (total === 0) {
    return { error: "Enter at least one non-zero balance, or start fresh instead." };
  }

  const user = await requireUser();
  const state = await getOnboardingState(user.id);
  if (!state.piggybankId) redirect("/onboarding/step-1");

  const supabase = await createClient();
  const { data: buckets, error: bucketsErr } = await supabase
    .from("bucket")
    .select("id, kind")
    .eq("piggybank_id", state.piggybankId);
  if (bucketsErr || !buckets) {
    console.error("submitOpeningBalancesAction buckets", bucketsErr?.message);
    return { error: "Couldn't load your buckets. Please try again." };
  }

  const bucketByKind = Object.fromEntries(buckets.map((b) => [b.kind, b.id])) as {
    spend?: string;
    save?: string;
    share?: string;
  };

  const rows: Array<{
    piggybank_id: string;
    kind: "opening_balance";
    amount_cents: number;
    bucket_id: string;
    note: string;
  }> = [];

  for (const [kind, dollars] of [
    ["spend", parsed.data.spend_dollars],
    ["save", parsed.data.save_dollars],
    ["share", parsed.data.share_dollars],
  ] as const) {
    const cents = dollarsToCents(dollars);
    if (cents > 0) {
      const bucket_id = bucketByKind[kind];
      if (!bucket_id) {
        return { error: `Couldn't find your ${kind} bucket. Please contact support.` };
      }
      rows.push({
        piggybank_id: state.piggybankId,
        kind: "opening_balance",
        amount_cents: cents,
        bucket_id,
        note: "Starting balance from existing piggybank",
      });
    }
  }

  const { error: insertErr } = await supabase.from("transaction").insert(rows);
  if (insertErr) {
    console.error("submitOpeningBalancesAction insert", insertErr.message);
    return { error: "Couldn't record opening balances. Please try again." };
  }

  redirect("/dashboard");
}
