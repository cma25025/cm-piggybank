import { createClient } from "@/lib/supabase/server";

export interface DashboardData {
  piggybankId: string;
  kidName: string;
  kidAvatarEmoji: string;
  totalBalanceCents: number;
  buckets: {
    id: string;
    kind: "spend" | "save" | "share";
    balanceCents: number;
    subCount: number;
  }[];
  rule: { spendBps: number; saveBps: number; shareBps: number };
  recentActivity: RecentActivityRow[];
  weeklyDeltaCents: number;
}

export interface RecentActivityRow {
  id: string;
  kind: "deposit" | "spend" | "transfer" | "interest" | "adjustment" | "opening_balance";
  amountCents: number;
  signedAmountCents: number;
  occurredAt: string;
  note: string | null;
  bucketKind: "spend" | "save" | "share" | null;
  subDisplayName: string | null;
  subEmoji: string | null;
  funderDisplayName: string | null;
  sourceType: string | null;
  parentId: string | null;
  voidedAt: string | null;
}

const SIGN: Record<RecentActivityRow["kind"], number> = {
  deposit: 1,
  spend: -1,
  interest: 1,
  opening_balance: 1,
  transfer: 1,
  adjustment: 1,
};

export async function getDashboardData(): Promise<DashboardData | null> {
  const supabase = await createClient();

  const { data: pb } = await supabase
    .from("piggybank")
    .select(
      "id, total_balance_cents, kid_profile(display_name, avatar_emoji), distribution_rule(spend_bps, save_bps, share_bps)",
    )
    .limit(1)
    .maybeSingle();
  if (!pb) return null;

  // Supabase nested selects return arrays even for FK-defined 1:1 relations.
  // Coerce to the first row (or null).
  const kidRaw = pb.kid_profile;
  const kid =
    (Array.isArray(kidRaw) ? kidRaw[0] : kidRaw) as { display_name?: string; avatar_emoji?: string } | null;
  const ruleRaw = pb.distribution_rule;
  const rule =
    ((Array.isArray(ruleRaw) ? ruleRaw[0] : ruleRaw) as
      | { spend_bps: number; save_bps: number; share_bps: number }
      | null) ?? { spend_bps: 6000, save_bps: 2000, share_bps: 2000 };

  const [{ data: buckets }, { data: txns }] = await Promise.all([
    supabase
      .from("bucket")
      .select("id, kind, balance_cents, subcategory(id)")
      .eq("piggybank_id", pb.id),
    supabase
      .from("transaction")
      .select(
        "id, kind, amount_cents, occurred_at, note, parent_id, source_type, voided_at, bucket(kind), subcategory(display_name, emoji), funder(display_name)",
      )
      .eq("piggybank_id", pb.id)
      .is("parent_id", null) // parent rows only; expand children on demand
      .order("occurred_at", { ascending: false })
      .limit(5),
  ]);

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: weeklyRows } = await supabase
    .from("transaction")
    .select("kind, amount_cents")
    .eq("piggybank_id", pb.id)
    .not("bucket_id", "is", null) // exclude parent deposit aggregator rows
    .gte("occurred_at", oneWeekAgo);
  const weeklyDeltaCents = (weeklyRows ?? []).reduce(
    (acc, r) =>
      acc + (SIGN[r.kind as RecentActivityRow["kind"]] ?? 0) * (r.amount_cents ?? 0),
    0,
  );

  const recentActivity: RecentActivityRow[] = (txns ?? []).map((t) => {
    const bucket = (t.bucket as { kind?: "spend" | "save" | "share" } | null) ?? null;
    const sub = (t.subcategory as { display_name?: string; emoji?: string } | null) ?? null;
    const funder = (t.funder as { display_name?: string } | null) ?? null;
    const sign = SIGN[t.kind as RecentActivityRow["kind"]] ?? 0;
    return {
      id: t.id,
      kind: t.kind as RecentActivityRow["kind"],
      amountCents: t.amount_cents ?? 0,
      signedAmountCents: sign * (t.amount_cents ?? 0),
      occurredAt: t.occurred_at,
      note: t.note,
      bucketKind: bucket?.kind ?? null,
      subDisplayName: sub?.display_name ?? null,
      subEmoji: sub?.emoji ?? null,
      funderDisplayName: funder?.display_name ?? null,
      sourceType: t.source_type,
      parentId: t.parent_id,
      voidedAt: t.voided_at,
    };
  });

  const bucketRows = (buckets ?? []).map((b) => ({
    id: b.id,
    kind: b.kind as "spend" | "save" | "share",
    balanceCents: b.balance_cents ?? 0,
    subCount: ((b.subcategory as { id: string }[] | null) ?? []).length,
  }));

  return {
    piggybankId: pb.id,
    kidName: kid?.display_name ?? "Piggybank",
    kidAvatarEmoji: kid?.avatar_emoji ?? "🐷",
    totalBalanceCents: pb.total_balance_cents ?? 0,
    buckets: bucketRows,
    rule: { spendBps: rule.spend_bps, saveBps: rule.save_bps, shareBps: rule.share_bps },
    recentActivity,
    weeklyDeltaCents,
  };
}
