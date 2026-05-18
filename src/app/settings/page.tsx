import { AppShell } from "@/components/layout/app-shell";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireUser } from "@/lib/auth/get-user";

/**
 * Phase 4 placeholder: the real Settings (kid profile edit, distribution rule,
 * password change, soft delete piggybank, JSON export) lands in Phase 9.
 */
export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-6">
        <h1 className="font-display text-3xl">Settings</h1>
        <div className="rounded-2xl bg-card border border-line-soft p-6 space-y-2">
          <div className="text-xs font-semibold uppercase text-ink-muted">Account</div>
          <div className="text-sm">{user.email}</div>
          <div className="pt-3">
            <LogoutButton />
          </div>
        </div>
        <div className="rounded-3xl border-2 border-dashed border-line p-8 text-center bg-card">
          <div className="text-5xl mb-3">⚙️</div>
          <p className="text-ink-muted text-sm max-w-md mx-auto">
            Kid profile edit, distribution rule, password change, JSON export, and
            piggybank delete land in Phase 9.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
