import { requireUser } from "@/lib/auth/get-user";
import { getOnboardingState } from "@/lib/onboarding/state";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StepShell } from "@/components/onboarding/step-shell";
import { Step4Tabs } from "./step-4-tabs";

export default async function Step4Page() {
  const user = await requireUser();
  const state = await getOnboardingState(user.id);
  if (!state.piggybankId) redirect("/onboarding/step-1");
  if (state.hasAnyTransaction) redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: funders }, { data: rule }] = await Promise.all([
    supabase
      .from("funder")
      .select("id, display_name")
      .eq("piggybank_id", state.piggybankId)
      .is("archived_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("distribution_rule")
      .select("spend_bps, save_bps, share_bps")
      .eq("piggybank_id", state.piggybankId)
      .maybeSingle(),
  ]);

  return (
    <StepShell
      step={4}
      title={state.kidName ? `Get ${state.kidName}'s piggybank started` : "Get the piggybank started"}
      subtitle="Are you starting fresh, or moving from a piggy bank you already have?"
    >
      <Step4Tabs
        funders={(funders ?? []).map((f) => f.display_name)}
        rule={
          rule
            ? {
                spend_bps: rule.spend_bps,
                save_bps: rule.save_bps,
                share_bps: rule.share_bps,
              }
            : { spend_bps: 6000, save_bps: 2000, share_bps: 2000 }
        }
      />
    </StepShell>
  );
}
