/**
 * Calendar-day staleness math. Salvaged from the divergent
 * `claude/review-next-session-md-0EPfc` branch (commit e9c164e).
 *
 * Replaces the wall-clock-naive `daysSince()` that used to live in
 * queries.ts. Uses UTC midnight boundaries on both ends so DST never
 * bends the math (UTC has no DST). Caretakers more than a few hours
 * from UTC may see a one-day drift relative to their local calendar;
 * v1 lives with that because the dashboard is server-rendered and we
 * don't have a tz hint. Phase 8 picks up an explicit `?tz=` for the
 * digest if we need it.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_DAYS = 7;

function utcMidnight(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export interface StalenessInput {
  lastReconcileAt: string | null;
  /** Override "now" for tests. Defaults to current time. */
  now?: Date;
}

export interface StalenessOutput {
  lastReconcileAt: string | null;
  daysSince: number | null;
  isStale: boolean;
}

export function computeStaleness(input: StalenessInput): StalenessOutput {
  const { lastReconcileAt } = input;
  if (!lastReconcileAt) {
    return { lastReconcileAt: null, daysSince: null, isStale: true };
  }
  const now = input.now ?? new Date();
  const last = new Date(lastReconcileAt);
  // Future-dated rows (shouldn't happen, but defensive): clamp to 0 days.
  const daysSince = Math.max(0, Math.round((utcMidnight(now) - utcMidnight(last)) / DAY_MS));
  return {
    lastReconcileAt,
    daysSince,
    isStale: daysSince >= STALE_DAYS,
  };
}
