/**
 * Sun-Sat week math. NOT ISO week (which is Mon-Sun) — caretaker-friendly
 * framing per the product spec (digest reads at the kitchen table on
 * Sunday morning, covers the prior Sun-Sat).
 *
 * Bounds computed in UTC. Caretakers more than a few hours from UTC may see
 * ±1 day drift relative to local calendar; same trade as `staleness.ts`.
 * A future Phase 8.5 could accept `?tz=` for tz-aware bounds.
 *
 * Week key format: YYYY-MM-DD where the date is the Sunday-start. The URL
 * `/digest/2026-05-17` means "the week starting Sunday May 17."
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Sunday 00:00:00 UTC of the week containing `d`. */
export function sundayOfWeek(d: Date): Date {
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = utc.getUTCDay(); // 0=Sun ... 6=Sat
  utc.setUTCDate(utc.getUTCDate() - dow);
  return utc;
}

export interface WeekBounds {
  start: Date; // Sunday 00:00 UTC (inclusive)
  end: Date;   // Following Sunday 00:00 UTC (exclusive)
  key: string; // YYYY-MM-DD of start, e.g. "2026-05-17"
}

export function weekBounds(d: Date): WeekBounds {
  const start = sundayOfWeek(d);
  const end = new Date(start.getTime() + 7 * DAY_MS);
  return { start, end, key: formatKey(start) };
}

export function currentWeekKey(now: Date = new Date()): string {
  return weekBounds(now).key;
}

/** Parse a YYYY-MM-DD week key into bounds, or null if malformed/not-a-Sunday. */
export function parseWeekKey(key: string): WeekBounds | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [y, m, d] = key.split("-").map((s) => parseInt(s, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(dt.getTime())) return null;
  // Must actually be a Sunday — otherwise the URL is malformed.
  if (dt.getUTCDay() !== 0) return null;
  return weekBounds(dt);
}

/** Previous Sunday-week key (for "← previous week" nav). */
export function previousWeekKey(key: string): string | null {
  const b = parseWeekKey(key);
  if (!b) return null;
  return formatKey(new Date(b.start.getTime() - 7 * DAY_MS));
}

/** Next Sunday-week key (for "next week →" nav). */
export function nextWeekKey(key: string): string | null {
  const b = parseWeekKey(key);
  if (!b) return null;
  return formatKey(new Date(b.start.getTime() + 7 * DAY_MS));
}

/** "May 17" / "May 17 – 23" / etc. Helpers for header copy. */
export function formatWeekLabel(b: WeekBounds): string {
  const startLabel = b.start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  // end is the following Sunday (exclusive); subtract 1 ms for "Saturday".
  const lastDay = new Date(b.end.getTime() - DAY_MS);
  const endLabel = lastDay.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return `${startLabel} – ${endLabel}`;
}

function formatKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
