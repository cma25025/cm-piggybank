import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { AddMoneyForm } from "./add-money-form";

export default async function AddMoneyPage() {
  await requireUser();
  const supabase = await createClient();
  const { data: pb } = await supabase
    .from("piggybank")
    .select("id, distribution_rule(spend_bps, save_bps, share_bps)")
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (!pb) redirect("/onboarding/step-1");

  const ruleRaw = pb.distribution_rule;
  const rule =
    ((Array.isArray(ruleRaw) ? ruleRaw[0] : ruleRaw) as
      | { spend_bps: number; save_bps: number; share_bps: number }
      | null) ?? { spend_bps: 6000, save_bps: 2000, share_bps: 2000 };

  const { data: funders } = await supabase
    .from("funder")
    .select("display_name")
    .eq("piggybank_id", pb.id)
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-xl mx-auto">
        <Link href="/dashboard" className="text-sm text-ink-muted hover:text-ink">
          ← Dashboard
        </Link>
        <div className="mt-6 rounded-3xl bg-card border border-line-soft p-6 sm:p-8 shadow-sm">
          <h1 className="font-display text-2xl mb-1">Add money to piggybank</h1>
          <p className="text-sm text-ink-muted mb-6">
            Record cash coming in. We'll auto-distribute into your three buckets.
          </p>
          <AddMoneyForm
            rule={{
              spend_bps: rule.spend_bps,
              save_bps: rule.save_bps,
              share_bps: rule.share_bps,
            }}
            funders={(funders ?? []).map((f) => f.display_name)}
          />
        </div>
      </div>
    </AppShell>
  );
}
