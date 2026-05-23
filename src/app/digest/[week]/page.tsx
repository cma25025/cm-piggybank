import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/get-user";
import {
  parseWeekKey,
  previousWeekKey,
  nextWeekKey,
  currentWeekKey,
  formatWeekLabel,
} from "@/lib/digest/week";
import { getDigestData } from "@/lib/digest/queries";
import { pickHeadline } from "@/lib/digest/copy";
import { formatCents } from "@/lib/utils";
import { DigestPrintButton } from "./digest-print-button";

export default async function DigestPage({
  params,
}: {
  params: Promise<{ week: string }>;
}) {
  const { week } = await params;
  const bounds = parseWeekKey(week);
  if (!bounds) notFound();

  await requireUser();
  const data = await getDigestData(bounds);
  if (!data) redirect("/onboarding/step-1");

  const headline = pickHeadline(data.netCents, data.kidName);
  const prev = previousWeekKey(week);
  const next = nextWeekKey(week);
  const isCurrent = week === currentWeekKey();

  return (
    <main className="min-h-screen bg-background print:bg-white">
      {/* On-screen nav row, hidden on print */}
      <div className="no-print max-w-3xl mx-auto px-6 pt-6 flex items-center justify-between text-sm">
        <Link href="/dashboard" className="text-ink-muted hover:text-ink">
          ← Dashboard
        </Link>
        <div className="flex items-center gap-3">
          {prev ? (
            <Link href={`/digest/${prev}`} className="text-ink-muted hover:text-ink">
              ← Prev week
            </Link>
          ) : null}
          {!isCurrent ? (
            <Link href={`/digest/${currentWeekKey()}`} className="text-ink-muted hover:text-ink">
              This week
            </Link>
          ) : null}
          {next ? (
            <Link href={`/digest/${next}`} className="text-ink-muted hover:text-ink">
              Next week →
            </Link>
          ) : null}
          <DigestPrintButton />
        </div>
      </div>

      <article className="max-w-3xl mx-auto p-6 md:p-10 print:p-8 space-y-6">
        {/* Header */}
        <header className="text-center pb-4 border-b border-line-soft">
          <div className="text-5xl print:text-4xl mb-2" aria-hidden>
            {data.kidAvatarEmoji}
          </div>
          <h1 className="font-display text-3xl print:text-2xl text-brand-deep">
            {data.kidName}'s Piggybank
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Week of {formatWeekLabel(bounds)}
          </p>
        </header>

        {/* Total card */}
        <section
          className="rounded-3xl print:rounded-xl p-8 print:p-6 text-white shadow-xl print:shadow-none"
          style={{
            backgroundImage: "linear-gradient(135deg, #F4655E 0%, #FF9C66 100%)",
          }}
        >
          <div className="text-xs uppercase tracking-wider opacity-90">
            Total in the piggybank today
          </div>
          <div className="font-display font-bold text-5xl print:text-4xl mt-2 tnum">
            {formatCents(data.totalBalanceCents)}
          </div>
          <div className="text-sm opacity-90 mt-3">{headline}</div>
        </section>

        {/* This-week numbers */}
        <section className="grid grid-cols-3 gap-3 print:gap-2">
          <NumberCard label="Money in" color="text-spend" cents={data.depositsInCents} sign="+" />
          <NumberCard
            label="Money out"
            color="text-share"
            cents={data.spendsOutCents}
            sign="−"
          />
          <NumberCard
            label="Net this week"
            color={
              data.netCents > 0 ? "text-spend" : data.netCents < 0 ? "text-share" : "text-ink-muted"
            }
            cents={Math.abs(data.netCents)}
            sign={data.netCents > 0 ? "+" : data.netCents < 0 ? "−" : ""}
          />
        </section>

        {/* Top spends */}
        <section>
          <h2 className="font-display text-lg font-bold mb-3">Top spends this week</h2>
          {data.topSpends.length === 0 ? (
            <p className="text-sm text-ink-muted bg-line-soft/40 rounded-xl px-3 py-3">
              Nothing spent this week. Sometimes that's the win.
            </p>
          ) : (
            <ul className="rounded-2xl print:rounded-lg bg-card border border-line-soft divide-y divide-line-soft">
              {data.topSpends.map((s) => (
                <li key={s.id} className="p-4 print:p-3 flex items-center gap-3">
                  <div className="text-2xl shrink-0">{s.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.displayName}</div>
                    {s.note ? (
                      <div className="text-xs text-ink-muted truncate">{s.note}</div>
                    ) : null}
                  </div>
                  <div className="font-data font-semibold tnum text-share">
                    − {formatCents(s.amountCents)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Goal progress */}
        {data.goalProgress.length > 0 ? (
          <section>
            <h2 className="font-display text-lg font-bold mb-3">Goals</h2>
            <ul className="space-y-2">
              {data.goalProgress.map((g) => (
                <li
                  key={g.id}
                  className="rounded-2xl print:rounded-lg bg-card border border-line-soft p-4 print:p-3"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-xl">{g.emoji}</div>
                    <div className="flex-1 min-w-0 font-medium truncate">{g.displayName}</div>
                    <div className="text-sm font-data tnum text-ink-muted">
                      {formatCents(g.balanceCents)} of {formatCents(g.targetCents)}
                    </div>
                  </div>
                  <div className="h-2 bg-line-soft rounded-full overflow-hidden">
                    <div
                      className="h-full bg-save rounded-full"
                      style={{ width: `${g.pct}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-ink-muted mt-1 tnum">{g.pct}% there</div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Footer */}
        <footer className="pt-4 border-t border-line-soft text-center text-xs text-ink-muted">
          Generated {formatWeekLabel(bounds)} · Piggybank
        </footer>
      </article>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: letter; margin: 0.5in; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </main>
  );
}

function NumberCard({
  label,
  color,
  cents,
  sign,
}: {
  label: string;
  color: string;
  cents: number;
  sign: string;
}) {
  return (
    <div className="rounded-2xl print:rounded-lg bg-card border border-line-soft p-4 print:p-3 text-center">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </div>
      <div className={`font-display font-bold text-xl mt-1 tnum ${color}`}>
        {sign} {formatCents(cents)}
      </div>
    </div>
  );
}
