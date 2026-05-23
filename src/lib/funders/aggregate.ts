/**
 * Pure funder-aggregation helper. Salvaged from the divergent
 * `claude/review-next-session-md-0EPfc` branch (commit ba2a6cf).
 *
 * Separated from `queries.ts` so vitest can exercise the math without
 * importing `next/headers` via the Supabase server client.
 */

export interface TopFunder {
  funderId: string;
  displayName: string;
  totalCents: number;
}

export interface RawTopFunderRow {
  funder_id: string | null;
  amount_cents: number | null;
  funder: { display_name: string | null } | { display_name: string | null }[] | null;
}

/** Collapse parent-deposit rows into per-funder totals, descending. */
export function aggregateTopFunders(rows: RawTopFunderRow[], limit = 3): TopFunder[] {
  const totals = new Map<string, { name: string; cents: number }>();
  for (const r of rows) {
    if (!r.funder_id) continue;
    const fRaw = r.funder;
    const f = (Array.isArray(fRaw) ? fRaw[0] : fRaw) as { display_name?: string | null } | null;
    const name = f?.display_name ?? "Someone";
    const prev = totals.get(r.funder_id);
    const add = r.amount_cents ?? 0;
    if (prev) {
      prev.cents += add;
    } else {
      totals.set(r.funder_id, { name, cents: add });
    }
  }
  return Array.from(totals.entries())
    .map(([funderId, v]) => ({ funderId, displayName: v.name, totalCents: v.cents }))
    .sort((a, b) => b.totalCents - a.totalCents)
    .slice(0, limit);
}
