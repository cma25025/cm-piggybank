import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Most recent reconciliation timestamp, or null if never reconciled.
 * Reconciliations are stored as kind='adjustment' transactions with a note
 * prefixed "Reconciled: ". Cached per render.
 */
export const getLastReconcileAt = cache(
  async (piggybankId: string): Promise<Date | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("transaction")
      .select("occurred_at")
      .eq("piggybank_id", piggybankId)
      .eq("kind", "adjustment")
      .like("note", "Reconciled:%")
      .order("occurred_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.occurred_at ? new Date(data.occurred_at) : null;
  },
);

/** Days since the last reconciliation, or Infinity if never. */
export function daysSince(lastAt: Date | null): number {
  if (!lastAt) return Infinity;
  const ms = Date.now() - lastAt.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
