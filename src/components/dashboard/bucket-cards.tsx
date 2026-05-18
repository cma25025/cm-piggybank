import Link from "next/link";
import { cn, formatCents } from "@/lib/utils";

interface BucketCardsProps {
  buckets: { id: string; kind: "spend" | "save" | "share"; balanceCents: number; subCount: number }[];
}

const META = {
  spend: { label: "Spend", emoji: "🛒", iconBg: "bg-spend-soft", text: "text-spend" },
  save: { label: "Save", emoji: "💰", iconBg: "bg-save-soft", text: "text-save" },
  share: { label: "Share", emoji: "💝", iconBg: "bg-share-soft", text: "text-share" },
} as const;

const ORDER: ("spend" | "save" | "share")[] = ["spend", "save", "share"];

export function BucketCards({ buckets }: BucketCardsProps) {
  const total = buckets.reduce((acc, b) => acc + b.balanceCents, 0);
  const sorted = ORDER.map((k) => buckets.find((b) => b.kind === k)).filter(
    (b): b is NonNullable<typeof b> => Boolean(b),
  );

  return (
    <section>
      <h2 className="font-display text-lg font-bold mb-3">Buckets</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {sorted.map((b) => {
          const meta = META[b.kind];
          const pct = total > 0 ? Math.round((b.balanceCents / total) * 100) : 0;
          return (
            <Link
              key={b.id}
              href={`/buckets/${b.kind}`}
              className="block rounded-2xl bg-card border border-line-soft p-5 hover:shadow-md hover:-translate-y-0.5 transition"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-xl",
                    meta.iconBg,
                  )}
                >
                  {meta.emoji}
                </div>
                <div className="font-display font-bold text-lg">{meta.label}</div>
                <div className="ml-auto text-xs font-semibold text-ink-muted tnum">
                  {pct}%
                </div>
              </div>
              <div className="font-display font-bold text-3xl tnum">
                {formatCents(b.balanceCents)}
              </div>
              <div className="text-sm text-ink-muted mt-1">
                {b.subCount} subcategor{b.subCount === 1 ? "y" : "ies"}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
