import Link from "next/link";
import { getTopFundersThisMonth } from "@/lib/funders/queries";
import { formatCents, initial } from "@/lib/utils";

interface Props {
  piggybankId: string;
}

/**
 * Top 3 contributors this calendar month. Returns null when there are no
 * deposits this month so the dashboard layout doesn't gain dead space.
 * Fills Dashboard.widgets slot.
 */
export async function FunderWidget({ piggybankId }: Props) {
  const top = await getTopFundersThisMonth(piggybankId, 3);
  if (top.length === 0) return null;

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display text-lg font-bold">Top contributors this month</h2>
        <Link href="/funders" className="text-sm text-brand font-medium hover:underline">
          View all →
        </Link>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {top.map((f) => (
          <li
            key={f.funderId}
            className="rounded-2xl bg-card border border-line-soft p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 shrink-0 rounded-full bg-brand text-white flex items-center justify-center font-display text-lg">
              {initial(f.displayName)}
            </div>
            <div className="flex-1 min-w-0">
              <Link
                href={`/funders/${f.funderId}`}
                className="text-sm font-medium truncate hover:opacity-80 transition block"
              >
                {f.displayName}
              </Link>
              <div className="font-display font-bold tnum text-spend">
                {formatCents(f.totalCents)}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
