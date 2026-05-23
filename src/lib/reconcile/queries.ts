import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Most recent reconciliation timestamp ISO, or null if never reconciled.
 * Reconciliations are stored as kind='adjustment' transactions with a note
 * prefixed "Reconciled:" (case-insensitive). Cached per render. Use with
 * `computeStaleness` from ./staleness for the calendar-day math.
 */
export const getLastReconcileAt = cache(
  async (piggybankId: string): Promise<string | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("transaction")
      .select("occurred_at")
      .eq("piggybank_id", piggybankId)
      .eq("kind", "adjustment")
      .ilike("note", "Reconciled:%")
      .order("occurred_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.occurred_at ?? null;
  },
);
