import { requireUser } from "@/lib/auth/get-user";
import { getOnboardingState } from "@/lib/onboarding/state";
import { LogoutButton } from "@/components/auth/logout-button";
import { redirect } from "next/navigation";

/**
 * Placeholder dashboard — Phase 4 builds the real composable dashboard with
 * named slots. For now: enforce onboarding completion (redirect to wizard if
 * the caretaker hasn't logged a single transaction yet) and show their
 * piggybank's basic state.
 */
export default async function DashboardPage() {
  const user = await requireUser();
  const state = await getOnboardingState(user.id);

  if (!state.piggybankId) redirect("/onboarding/step-1");
  if (!state.hasAnyTransaction) redirect("/onboarding/step-4");

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="text-3xl" aria-hidden>
              🐷
            </div>
            <span className="font-display text-2xl text-brand-deep">Piggybank</span>
          </div>
          <LogoutButton />
        </div>
        <div className="bg-card rounded-2xl border border-line-soft p-8">
          <h1 className="font-display text-2xl mb-2">
            {state.kidName ? `${state.kidName}'s Piggybank` : "Piggybank"}
          </h1>
          <p className="text-sm text-ink-muted">
            Logged in as <span className="font-medium text-ink">{user.email}</span>.
          </p>
          <p className="text-sm text-ink-muted mt-4">
            Phase 3 onboarding is complete. The real dashboard (total card, bucket cards,
            recent activity) lands in Phase 4.
          </p>
        </div>
      </div>
    </main>
  );
}
