import { formatCents } from "@/lib/utils";

interface TotalCardProps {
  totalCents: number;
  weeklyDeltaCents: number;
  rule: { spendBps: number; saveBps: number; shareBps: number };
}

export function TotalCard({ totalCents, weeklyDeltaCents, rule }: TotalCardProps) {
  const split = `${rule.spendBps / 100}/${rule.saveBps / 100}/${rule.shareBps / 100}`;
  const deltaSign = weeklyDeltaCents >= 0 ? "+" : "−";
  const deltaAbs = Math.abs(weeklyDeltaCents);
  return (
    <div className="rounded-3xl p-8 text-white shadow-xl flex items-center justify-between flex-wrap gap-6"
      style={{
        backgroundImage: "linear-gradient(135deg, #F4655E 0%, #FF9C66 100%)",
      }}
    >
      <div>
        <div className="text-xs uppercase tracking-wider opacity-90">
          Total balance · cash
        </div>
        <div className="font-display font-bold text-5xl md:text-6xl mt-2 tnum">
          {formatCents(totalCents)}
        </div>
        <div className="text-sm opacity-90 mt-3">
          {weeklyDeltaCents !== 0 ? (
            <>
              {deltaSign} {formatCents(deltaAbs)} this week
            </>
          ) : (
            <>No change this week</>
          )}
          {" · auto-distributed "}
          {split}
        </div>
      </div>
      <div
        className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center text-6xl"
        aria-hidden
      >
        🐷
      </div>
    </div>
  );
}
