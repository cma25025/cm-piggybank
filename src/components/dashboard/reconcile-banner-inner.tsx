"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ReconcileDialog } from "@/app/reconcile/reconcile-dialog";

interface Props {
  daysOverdue: number | null;
  currentTotalCents: number;
}

export function ReconcileBannerInner({ daysOverdue, currentTotalCents }: Props) {
  const [open, setOpen] = useState(false);

  const headline = daysOverdue == null
    ? "Time to check the jar"
    : `It's been ${daysOverdue} days since you checked the jar`;

  return (
    <>
      <div className="rounded-2xl border border-brand-soft bg-brand-soft/60 p-4 flex items-center gap-4 flex-wrap">
        <div className="text-2xl shrink-0" aria-hidden>
          ⚖️
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-brand-deep">{headline}</div>
          <div className="text-sm text-ink-muted">
            Real-world cash drifts. A quick count keeps the app honest.
          </div>
        </div>
        <Button onClick={() => setOpen(true)} variant="default" size="sm">
          Check the jar
        </Button>
      </div>
      <ReconcileDialog
        open={open}
        onOpenChange={setOpen}
        currentTotalCents={currentTotalCents}
      />
    </>
  );
}
