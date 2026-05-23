import { createClient } from "@/lib/supabase/server";
import type { WeekBounds } from "./week";

export interface DigestData {
  piggybankId: string;
  kidName: string;
  kidAvatarEmoji: string;
  totalBalanceCents: number;
  depositsInCents: number;
  spendsOutCents: number;
  netCents: number;
  topSpends: { id: string; displayName: string; emoji: string; amountCents: number; note: string | null }[];
  goalProgress: { id: string; displayName: string; emoji: string; balanceCents: number; targetCents: number; pct: number }[];
}

/**
 * Pull everything the digest needs in one shot. Server-only.
 * Aggregations are JS-side; we ignore v_weekly_digest because its
 * Postgres date_trunc('week', ...) is ISO Mon-Sun, not our Sun-Sat.
 */
export async function getDigestData(bounds: WeekBounds): Promise<DigestData | null> {
  const supabase = await createClient();

  const { data: pb } = await supabase
    .from("piggybank")
    .select("id, total_balance_cents, kid_profile(display_name, avatar_emoji)")
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (!pb) return null;

  const kidRaw = pb.kid_profile;
  const kid = (Array.isArray(kidRaw) ? kidRaw[0] : kidRaw) as
    | { display_name?: string; avatar_emoji?: string }
    | null;

  const [{ data: txns }, { data: goals }] = await Promise.all([
    supabase
      .from("transaction")
      .select(
        "id, kind, amount_cents, parent_id, voided_at, note, subcategory:subcategory_id(display_name, emoji)",
      )
      .eq("piggybank_id", pb.id)
      .is("voided_at", null)
      .gte("occurred_at", bounds.start.toISOString())
      .lt("occurred_at", bounds.end.toISOString()),
    supabase
      .from("subcategory")
      .select("id, display_name, emoji, balance_cents, target_amount_cents, bucket:bucket_id(kind)")
      .eq("piggybank_id", pb.id)
      .is("archived_at", null)
      .not("target_amount_cents", "is", null),
  ]);

  // Deposits: count parent rows only (children would triple-count).
  // Spends: count spend rows.
  let depositsIn = 0;
  let spendsOut = 0;
  for (const t of txns ?? []) {
    if (t.kind === "deposit" && t.parent_id === null) {
      depositsIn += t.amount_cents ?? 0;
    } else if (t.kind === "spend") {
      spendsOut += t.amount_cents ?? 0;
    }
  }
  const netCents = depositsIn - spendsOut;

  // Top 3 spends in dollar terms.
  const topSpends = (txns ?? [])
    .filter((t) => t.kind === "spend")
    .sort((a, b) => (b.amount_cents ?? 0) - (a.amount_cents ?? 0))
    .slice(0, 3)
    .map((t) => {
      const sub = (Array.isArray(t.subcategory) ? t.subcategory[0] : t.subcategory) as
        | { display_name?: string; emoji?: string }
        | null;
      return {
        id: t.id,
        displayName: sub?.display_name ?? "Spend",
        emoji: sub?.emoji ?? "🛒",
        amountCents: t.amount_cents ?? 0,
        note: t.note ?? null,
      };
    });

  // Goal progress: subs with a target. Only Save bucket goals are typically
  // set, but Share goals (causes) work too.
  const goalProgress = (goals ?? [])
    .filter((g) => g.target_amount_cents && g.target_amount_cents > 0)
    .map((g) => {
      const balance = Number(g.balance_cents ?? 0);
      const target = Number(g.target_amount_cents);
      return {
        id: g.id,
        displayName: g.display_name,
        emoji: g.emoji,
        balanceCents: balance,
        targetCents: target,
        pct: Math.min(100, Math.max(0, Math.round((balance / target) * 100))),
      };
    })
    .sort((a, b) => b.pct - a.pct);

  return {
    piggybankId: pb.id,
    kidName: kid?.display_name ?? "Kid",
    kidAvatarEmoji: kid?.avatar_emoji ?? "🐷",
    totalBalanceCents: Number(pb.total_balance_cents ?? 0),
    depositsInCents: depositsIn,
    spendsOutCents: spendsOut,
    netCents,
    topSpends,
    goalProgress,
  };
}
