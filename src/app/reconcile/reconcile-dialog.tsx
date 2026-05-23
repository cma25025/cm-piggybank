"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCents, cn } from "@/lib/utils";
import { RECONCILE_REASONS } from "@/lib/reconcile/schemas";
import { recordReconciliationAction, type ReconcileState } from "./actions";

const INITIAL: ReconcileState = {};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  currentTotalCents: number;
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Recording..." : "Record reconciliation"}
    </Button>
  );
}

export function ReconcileDialog({ open, onOpenChange, currentTotalCents }: Props) {
  const [state, formAction] = useFormState(recordReconciliationAction, INITIAL);
  const [actualStr, setActualStr] = useState("");

  // Diff preview (client estimate; server re-computes at submit for truth).
  const actualCents = (() => {
    const n = parseFloat(actualStr);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.round(n * 100);
  })();
  const diffCents = actualCents != null ? actualCents - currentTotalCents : null;

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      setActualStr("");
    }
  }, [state.success, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check the jar</DialogTitle>
          <DialogDescription>
            Count what&apos;s actually in the jar. We&apos;ll record the drift against the
            Spend bucket so the app and the jar match again.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="rounded-xl bg-line-soft/40 border border-line-soft p-3">
            <div className="text-xs text-ink-muted uppercase tracking-wide">
              App says
            </div>
            <div className="font-display font-bold text-xl tnum">
              {formatCents(currentTotalCents)}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="actual_dollars">Actual total in the jar</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
                $
              </span>
              <Input
                id="actual_dollars"
                name="actual_dollars"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
                className="pl-7 font-display text-2xl h-14 tnum"
                value={actualStr}
                onChange={(e) => setActualStr(e.target.value)}
                autoFocus
              />
            </div>
            {state.fieldErrors?.actual_dollars ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.actual_dollars}
              </p>
            ) : null}
          </div>

          {diffCents != null && actualCents != null ? (
            <div
              className={cn(
                "rounded-xl border-2 p-3 text-sm",
                diffCents === 0
                  ? "bg-spend-soft border-spend/30 text-spend"
                  : diffCents > 0
                    ? "bg-spend-soft border-spend/30 text-spend"
                    : "bg-share-soft border-share/30 text-share",
              )}
            >
              {diffCents === 0 ? (
                <>
                  <span className="font-semibold">Spot on.</span> Jar matches the app.
                </>
              ) : diffCents > 0 ? (
                <>
                  <span className="font-semibold">+{formatCents(diffCents)}</span> in the
                  jar that wasn&apos;t in the app.
                </>
              ) : (
                <>
                  <span className="font-semibold">−{formatCents(-diffCents)}</span> missing
                  from the jar (or extra in the app).
                </>
              )}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Why the drift?</Label>
            <div className="space-y-1.5">
              {RECONCILE_REASONS.map((r, idx) => (
                <label key={r.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    defaultChecked={idx === 0}
                    required
                    className="accent-brand"
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reconcile-note">Note (optional)</Label>
            <Input
              id="reconcile-note"
              name="note"
              type="text"
              maxLength={200}
              placeholder="e.g. cousin's birthday gift wasn't logged"
            />
          </div>

          {state.error ? (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Submit />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
