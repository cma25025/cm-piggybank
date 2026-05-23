import { getLastReconcileAt } from "@/lib/reconcile/queries";
import { computeStaleness } from "@/lib/reconcile/staleness";
import { ReconcileBannerInner } from "./reconcile-banner-inner";

interface Props {
  piggybankId: string;
  currentTotalCents: number;
}

/**
 * Renders the reconciliation nudge banner when the caretaker hasn't
 * checked the jar in 7+ calendar days. Returns null otherwise so
 * Dashboard.banner slot stays empty. Fills Dashboard.banner.
 */
export async function ReconcileBanner({ piggybankId, currentTotalCents }: Props) {
  const lastAt = await getLastReconcileAt(piggybankId);
  const { daysSince, isStale } = computeStaleness({ lastReconcileAt: lastAt });
  if (!isStale) return null;

  return (
    <ReconcileBannerInner
      daysOverdue={daysSince}
      currentTotalCents={currentTotalCents}
    />
  );
}
