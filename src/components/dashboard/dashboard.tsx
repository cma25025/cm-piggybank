import { TotalCard } from "./total-card";
import { BucketCards } from "./bucket-cards";
import { RecentActivity } from "./recent-activity";
import { DefaultCtaRow } from "./default-cta-row";
import type { DashboardData } from "@/lib/dashboard/queries";

interface DashboardProps {
  data: DashboardData;
  /** Phase 7 reconciliation banner fills this slot. */
  banner?: React.ReactNode;
  /** Phase 8 "Print digest" button augments this slot. */
  ctaRow?: React.ReactNode;
  /** Phase 6 funder widgets fill this slot. */
  widgets?: React.ReactNode;
}

/**
 * Composable caretaker dashboard. Named slots (banner, cta-row, widgets) let
 * later phases drop content in without modifying the dashboard layout itself.
 * See docs/v1-implementation-plan.md §5 Phase 4 (OV7).
 */
export function Dashboard({ data, banner, ctaRow, widgets }: DashboardProps) {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <PageHead kidName={data.kidName} />
      {banner /* Phase 7 reconciliation banner */}
      <TotalCard
        totalCents={data.totalBalanceCents}
        weeklyDeltaCents={data.weeklyDeltaCents}
        rule={data.rule}
      />
      {ctaRow ?? <DefaultCtaRow />}
      <BucketCards buckets={data.buckets} />
      {widgets /* Phase 6 funder widgets, v1.1 APR / statements teasers */}
      <RecentActivity rows={data.recentActivity} />
    </div>
  );
}

function PageHead({ kidName }: { kidName: string }) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-4">
      <div>
        <h1 className="font-display text-3xl text-ink tracking-tight">
          {kidName}'s Piggybank
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          You're the custodian. Cash on the kitchen counter, recorded here.
        </p>
      </div>
    </div>
  );
}
