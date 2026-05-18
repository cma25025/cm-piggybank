import { AppShell } from "@/components/layout/app-shell";
import { COMING_SOON } from "@/lib/coming-soon-manifest";

/**
 * Phase 4 placeholder: the real Funders screen lands in Phase 6 with
 * per-funder stats from the v_funder_stats view. For now the route exists
 * so the sidebar link doesn't 404.
 */
export default function FundersPage() {
  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-2xl mx-auto">
        <div className="rounded-3xl border-2 border-dashed border-line p-10 text-center bg-card">
          <div className="text-6xl mb-4">👥</div>
          <h1 className="font-display text-2xl mb-2">Funders</h1>
          <p className="text-ink-muted max-w-md mx-auto">
            List of who's contributed, per-funder totals, and the manage UI. You can
            already add funders during onboarding and when logging deposits.
          </p>
          <div className="mt-6 inline-block rounded-full bg-brand-soft text-brand-deep text-xs font-semibold px-3 py-1 uppercase tracking-wide">
            Building in Phase 6
          </div>
        </div>
      </div>
    </AppShell>
  );
}
