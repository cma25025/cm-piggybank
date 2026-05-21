import { requireUser } from "@/lib/auth/get-user";
import { getOnboardingState } from "@/lib/onboarding/state";
import { getDashboardData } from "@/lib/dashboard/queries";
import { Dashboard } from "@/components/dashboard/dashboard";
import { FunderWidget } from "@/components/dashboard/funder-widget";
import { ReconcileBanner } from "@/components/dashboard/reconcile-banner";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await requireUser();
  const state = await getOnboardingState(user.id);

  if (!state.piggybankId) redirect("/onboarding/step-1");
  if (!state.hasAnyTransaction) redirect("/onboarding/step-4");

  const data = await getDashboardData();
  if (!data) redirect("/onboarding/step-1");

  return (
    <Dashboard
      data={data}
      banner={
        <ReconcileBanner
          piggybankId={data.piggybankId}
          currentTotalCents={data.totalBalanceCents}
        />
      }
      widgets={<FunderWidget piggybankId={data.piggybankId} />}
    />
  );
}
