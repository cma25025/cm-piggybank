import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/get-user";
import { getOnboardingState } from "@/lib/onboarding/state";

export default async function OnboardingEntryPage() {
  const user = await requireUser();
  const state = await getOnboardingState(user.id);

  if (state.recommendedStep === "done") redirect("/dashboard");
  redirect(`/onboarding/step-${state.recommendedStep}`);
}
