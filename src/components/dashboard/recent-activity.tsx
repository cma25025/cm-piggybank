import Link from "next/link";
import type { RecentActivityRow } from "@/lib/dashboard/queries";
import { formatCents } from "@/lib/utils";

interface RecentActivityProps {
  rows: RecentActivityRow[];
}

const SOURCE_EMOJI: Record<string, string> = {
  allowance: "💵",
  birthday: "🎁",
  chores: "🧹",
  gift: "🎀",
  other: "💵",
};

export function RecentActivity({ rows }: RecentActivityProps) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display text-lg font-bold">Recent activity</h2>
        <Link href="/activity" className="text-sm text-brand font-medium hover:underline">
          View all →
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-8 text-center text-ink-muted">
          No activity yet. Add money or log a spend to see it here.
        </div>
      ) : (
        <ul className="rounded-2xl bg-card border border-line-soft divide-y divide-line-soft">
          {rows.map((r) => (
            <ActivityRow key={r.id} row={r} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ActivityRow({ row }: { row: RecentActivityRow }) {
  const emoji = pickEmoji(row);
  const title = pickTitle(row);
  const meta = pickMeta(row);
  const positive = row.signedAmountCents > 0;
  const voided = row.voidedAt != null;

  return (
    <li className="flex items-center gap-3 p-4">
      <div className="w-9 h-9 rounded-xl bg-line-soft flex items-center justify-center text-lg shrink-0">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className={"text-sm font-medium truncate " + (voided ? "line-through text-ink-muted" : "")}>
          {title}
        </div>
        <div className="text-xs text-ink-muted truncate">{meta}</div>
      </div>
      <div
        className={
          "font-data font-semibold tabular-nums tnum text-sm " +
          (voided ? "line-through text-ink-muted" : positive ? "text-spend" : "text-ink")
        }
      >
        {positive ? "+" : "−"} {formatCents(Math.abs(row.signedAmountCents))}
      </div>
    </li>
  );
}

function pickEmoji(r: RecentActivityRow): string {
  if (r.subEmoji) return r.subEmoji;
  if (r.kind === "deposit") return SOURCE_EMOJI[r.sourceType ?? "other"] ?? "💵";
  if (r.kind === "interest") return "📈";
  if (r.kind === "adjustment") return "🔧";
  if (r.kind === "opening_balance") return "🏦";
  return "·";
}

function pickTitle(r: RecentActivityRow): string {
  if (r.note) return r.note;
  if (r.kind === "deposit") {
    return r.funderDisplayName
      ? `${r.sourceType ?? "Deposit"} from ${r.funderDisplayName}`
      : `${r.sourceType ?? "Deposit"}`;
  }
  if (r.kind === "spend") return r.subDisplayName ? `${r.subDisplayName}` : "Spend";
  if (r.kind === "interest") return "Interest earned";
  if (r.kind === "adjustment") return "Jar adjustment";
  if (r.kind === "opening_balance") return "Starting balance";
  return r.kind;
}

function pickMeta(r: RecentActivityRow): string {
  const date = new Date(r.occurredAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const parts: string[] = [date];
  if (r.bucketKind) {
    parts.push(r.bucketKind.charAt(0).toUpperCase() + r.bucketKind.slice(1));
  }
  if (r.subDisplayName && r.kind !== "spend") parts.push(r.subDisplayName);
  return parts.join(" · ");
}
