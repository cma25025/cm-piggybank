import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/get-user";
import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/server";
import { getFunders } from "@/lib/funders/queries";
import { FunderRow } from "./funder-row";
import { AddFunderButton } from "./add-funder-button";

export default async function FundersPage() {
  await requireUser();
  const supabase = await createClient();
  const { data: pb } = await supabase
    .from("piggybank")
    .select("id")
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (!pb) redirect("/onboarding/step-1");

  const all = await getFunders(pb.id);
  const active = all.filter((f) => !f.archived_at);
  const archived = all.filter((f) => f.archived_at);

  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl">Funders</h1>
            <p className="text-sm text-ink-muted mt-1">
              Who&apos;s contributing. Track deposits by source.
            </p>
          </div>
          <AddFunderButton />
        </div>

        {active.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-10 text-center text-ink-muted">
            No funders yet. The primary funder was added automatically during onboarding.
          </div>
        ) : (
          <ul className="space-y-2">
            {active.map((f) => (
              <FunderRow
                key={f.funder_id}
                funderId={f.funder_id}
                displayName={f.display_name}
                relationship={f.relationship}
                totalContributedCents={f.total_contributed_cents}
                depositCount={f.deposit_count}
                lastContributionAt={f.last_contribution_at}
                archived={false}
              />
            ))}
          </ul>
        )}

        {archived.length > 0 ? (
          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-ink-muted hover:text-ink">
              Archived ({archived.length})
            </summary>
            <ul className="space-y-2 mt-3">
              {archived.map((f) => (
                <FunderRow
                  key={f.funder_id}
                  funderId={f.funder_id}
                  displayName={f.display_name}
                  relationship={f.relationship}
                  totalContributedCents={f.total_contributed_cents}
                  depositCount={f.deposit_count}
                  lastContributionAt={f.last_contribution_at}
                  archived={true}
                />
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </AppShell>
  );
}
