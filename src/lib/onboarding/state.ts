import { createClient } from "@/lib/supabase/server";

export interface OnboardingState {
  caretakerUserId: string;
  piggybankId: string | null;
  kidName: string | null;
  hasAnyTransaction: boolean;
  /** Next step to send the user to when they hit /onboarding root. */
  recommendedStep: 1 | 2 | 3 | 4 | "done";
}

/** Reads the caretaker's onboarding progress from the live DB. */
export async function getOnboardingState(caretakerUserId: string): Promise<OnboardingState> {
  const supabase = await createClient();

  // We deliberately use the Auth-aware client; RLS filters to this caretaker's
  // own piggybank (and excludes soft-deleted).
  const { data: piggybank } = await supabase
    .from("piggybank")
    .select("id, display_name, kid_profile_id, kid_profile(display_name)")
    .limit(1)
    .maybeSingle();

  if (!piggybank) {
    return {
      caretakerUserId,
      piggybankId: null,
      kidName: null,
      hasAnyTransaction: false,
      recommendedStep: 1,
    };
  }

  const { count } = await supabase
    .from("transaction")
    .select("id", { count: "exact", head: true })
    .eq("piggybank_id", piggybank.id);

  const hasAnyTransaction = (count ?? 0) > 0;

  const kidName =
    (piggybank.kid_profile as { display_name?: string } | null)?.display_name ?? null;

  return {
    caretakerUserId,
    piggybankId: piggybank.id,
    kidName,
    hasAnyTransaction,
    recommendedStep: hasAnyTransaction ? "done" : 4,
  };
}
