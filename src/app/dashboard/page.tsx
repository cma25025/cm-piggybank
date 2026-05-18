import { requireUser } from "@/lib/auth/get-user";
import { LogoutButton } from "@/components/auth/logout-button";

/**
 * Phase 2 placeholder dashboard. Phase 4 builds the real composable
 * dashboard with named slots; Phase 3 routes new caretakers through the
 * onboarding wizard before they ever land here.
 */
export default async function DashboardPage() {
  const user = await requireUser();

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
          <h1 className="font-display text-2xl mb-2">You're signed in</h1>
          <p className="text-sm text-ink-muted">
            Logged in as <span className="font-medium text-ink">{user.email}</span>.
          </p>
          <p className="text-sm text-ink-muted mt-4">
            Phase 2 ships auth only. Onboarding (Phase 3) and the real dashboard (Phase 4)
            land in subsequent phases.
          </p>
        </div>
      </div>
    </main>
  );
}
