import { getLastReconcileAt, daysSince } from "@/lib/reconcile/queries";
import { ReconcileBannerInner } from "./reconcile-banner-inner";

interface Props {
  piggybankId: string;
  currentTotalCents: number;
}

const NUDGE_THRESHOLD_DAYS = 7;

/**
 * Renders the reconciliation nudge banner when the caretaker hasn't
 * checked the jar in 7+ days. Returns null otherwise so Dashboard.banner
 * slot stays empty. Fills Dashboard.banner.
 */
export async function ReconcileBanner({ piggybankId, currentTotalCents }: Props) {
  const lastAt = await getLastReconcileAt(piggybankId);
  const days = daysSince(lastAt);
  if (days < NUDGE_THRESHOLD_DAYS) return null;

  return (
    <ReconcileBannerInner
      daysOverdue={Number.isFinite(days) ? days : null}
      currentTotalCents={currentTotalCents}
    />
  );
}
