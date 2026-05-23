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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { voidTransactionAction, type VoidState } from "./void-actions";

const INITIAL: VoidState = {};

interface Props {
  transactionId: string;
  isVoided: boolean;
  rowSummary: string;
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant="destructive">
      {pending ? "Voiding..." : "Void this transaction"}
    </Button>
  );
}

export function VoidButton({ transactionId, isVoided, rowSummary }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(voidTransactionAction, INITIAL);

  // Close the dialog after a successful void. Deps on the whole `state`
  // object (not primitive `state.success`) so a second consecutive success
  // re-fires the effect — primitives short-circuit Object.is(true, true).
  // useFormState returns a new object reference per action call.
  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state]);

  if (isVoided) {
    return (
      <span className="text-[10px] uppercase tracking-wide bg-line-soft text-ink-muted px-1.5 py-0.5 rounded">
        Voided
      </span>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-ink-muted">
          Void
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Void this transaction?</DialogTitle>
          <DialogDescription>
            <span className="block mt-1 text-ink">{rowSummary}</span>
            <span className="block mt-3">
              We'll write a reversing adjustment so the balance returns to what it was.
              The original row stays in your activity log, struck through.
            </span>
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="transaction_id" value={transactionId} />
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Input id="reason" name="reason" placeholder="e.g. wrong amount" maxLength={280} />
          </div>
          {state.error ? (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Keep it
            </Button>
            <Submit />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
