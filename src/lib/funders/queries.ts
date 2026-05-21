import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface FunderStatsRow {
  funder_id: string;
  piggybank_id: string;
  display_name: string;
  relationship: string | null;
  archived_at: string | null;
  total_contributed_cents: number;
  deposit_count: number;
  last_contribution_at: string | null;
}

/** All funders for a piggybank, active first (sorted by total contributed desc). */
export async function getFunders(piggybankId: string): Promise<FunderStatsRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_funder_stats")
    .select("*")
    .eq("piggybank_id", piggybankId)
    .order("total_contributed_cents", { ascending: false });
  return (data ?? []) as FunderStatsRow[];
}

/** Single funder by id; null if not found / not yours. */
export async function getFunderById(funderId: string): Promise<FunderStatsRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_funder_stats")
    .select("*")
    .eq("funder_id", funderId)
    .maybeSingle();
  return (data as FunderStatsRow | null) ?? null;
}

export interface FunderHistoryRow {
  id: string;
  amount_cents: number;
  occurred_at: string;
  source_type: string | null;
  note: string | null;
}

/** Parent deposit rows for a single funder (no triple-count). */
export async function getFunderHistory(
  piggybankId: string,
  funderId: string,
): Promise<FunderHistoryRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transaction")
    .select("id, amount_cents, occurred_at, source_type, note")
    .eq("piggybank_id", piggybankId)
    .eq("funder_id", funderId)
    .eq("kind", "deposit")
    .is("parent_id", null)
    .order("occurred_at", { ascending: false })
    .limit(100);
  return (data ?? []) as FunderHistoryRow[];
}

export interface TopFunder {
  funderId: string;
  displayName: string;
  totalCents: number;
}

/**
 * Top N funders in the trailing 30 days. Aggregates parent deposits only
 * (no triple-count from children). Returns empty array if no deposits.
 * Cached for a single render via React.cache so the dashboard's FunderWidget
 * doesn't refetch when the parent re-renders.
 *
 * Uses a rolling 30-day window instead of "this calendar month" so the
 * widget doesn't blink to empty at month boundaries (the UTC-month variant
 * showed nothing for PST caretakers from 5pm local on the last day of the
 * month until midnight UTC).
 */
export const getTopFundersThisMonth = cache(
  async (piggybankId: string, limit: number = 3): Promise<TopFunder[]> => {
    const supabase = await createClient();
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const { data } = await supabase
      .from("transaction")
      .select("funder_id, amount_cents, funder:funder_id(display_name)")
      .eq("piggybank_id", piggybankId)
      .eq("kind", "deposit")
      .is("parent_id", null)
      .gte("occurred_at", since.toISOString())
      .not("funder_id", "is", null);

    if (!data || data.length === 0) return [];

    const totals = new Map<string, { name: string; total: number }>();
    for (const row of data) {
      if (!row.funder_id) continue;
      const fObj = Array.isArray(row.funder) ? row.funder[0] : row.funder;
      const name = (fObj as { display_name?: string } | null)?.display_name ?? "Unknown";
      const prev = totals.get(row.funder_id);
      totals.set(row.funder_id, {
        name,
        total: (prev?.total ?? 0) + (row.amount_cents ?? 0),
      });
    }

    return Array.from(totals.entries())
      .map(([funderId, v]) => ({
        funderId,
        displayName: v.name,
        totalCents: v.total,
      }))
      .sort((a, b) => b.totalCents - a.totalCents)
      .slice(0, limit);
  },
);

