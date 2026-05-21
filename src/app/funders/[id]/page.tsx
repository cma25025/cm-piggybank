import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/get-user";
import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/server";
import { getFunderById, getFunderHistory } from "@/lib/funders/queries";
import { formatCents, initial } from "@/lib/utils";

const SOURCE_EMOJI: Record<string, string> = {
  allowance: "💵",
  birthday: "🎁",
  chores: "🧹",
  gift: "🎀",
  other: "💵",
};

export default async function FunderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();

  const supabase = await createClient();
  const { data: pb } = await supabase
    .from("piggybank")
    .select("id")
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (!pb) redirect("/onboarding/step-1");

  const funder = await getFunderById(id);
  if (!funder) notFound();

  const history = await getFunderHistory(pb.id, id);

  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
        <Link href="/funders" className="text-sm text-ink-muted hover:text-ink">
          ← Funders
        </Link>

        <div className="rounded-3xl bg-card border border-line-soft p-6 sm:p-8 flex items-center gap-5">
          <div className="w-16 h-16 shrink-0 rounded-full bg-brand text-white flex items-center justify-center font-display text-2xl">
            {initial(funder.display_name)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-3xl truncate">
              {funder.display_name}
              {funder.archived_at ? (
                <span className="ml-3 text-xs uppercase tracking-wide bg-line-soft text-ink-muted px-2 py-1 rounded align-middle">
                  Archived
                </span>
              ) : null}
            </h1>
            {funder.relationship ? (
              <p className="text-sm text-ink-muted">{funder.relationship}</p>
            ) : null}
            <div className="mt-3 font-display font-bold text-3xl tnum text-brand-deep">
              {formatCents(funder.total_contributed_cents)}
            </div>
            <p className="text-xs text-ink-muted tnum">
              {funder.deposit_count} {funder.deposit_count === 1 ? "deposit" : "deposits"}
              {funder.last_contribution_at
                ? ` · last on ${new Date(funder.last_contribution_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                : ""}
            </p>
          </div>
        </div>

        <section>
          <h2 className="font-display text-lg font-bold mb-3">History</h2>
          {history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-10 text-center text-ink-muted">
              No deposits from {funder.display_name} yet.
            </div>
          ) : (
            <ul className="rounded-2xl bg-card border border-line-soft divide-y divide-line-soft">
              {history.map((row) => (
                <li key={row.id} className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-line-soft flex items-center justify-center text-lg shrink-0">
                    {SOURCE_EMOJI[row.source_type ?? "other"] ?? "💵"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {row.note || row.source_type || "Deposit"}
                    </div>
                    <div className="text-xs text-ink-muted">
                      {new Date(row.occurred_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {row.source_type ? ` · ${row.source_type}` : ""}
                    </div>
                  </div>
                  <div className="font-data font-semibold tnum text-sm text-spend">
                    + {formatCents(row.amount_cents)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
