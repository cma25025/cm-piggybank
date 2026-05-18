"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCents } from "@/lib/utils";
import { logSpendAction, type LogSpendState } from "./actions";

const INITIAL: LogSpendState = {};

interface Sub {
  id: string;
  displayName: string;
  emoji: string;
  balanceCents: number;
  bucketKind: "spend" | "save" | "share";
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Recording..." : "Log spend"}
    </Button>
  );
}

export function LogSpendForm({ subs }: { subs: Sub[] }) {
  const [state, formAction] = useFormState(logSpendAction, INITIAL);

  const byBucket = {
    spend: subs.filter((s) => s.bucketKind === "spend"),
    save: subs.filter((s) => s.bucketKind === "save"),
    share: subs.filter((s) => s.bucketKind === "share"),
  };

  if (subs.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No subcategories yet. Add one from a bucket page before logging spends.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="amount_dollars">Amount</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">$</span>
          <Input
            id="amount_dollars"
            name="amount_dollars"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            required
            className="pl-7 font-display text-2xl h-14 tnum"
            autoFocus
          />
        </div>
        {state.fieldErrors?.amount_dollars ? (
          <p className="text-sm text-destructive">{state.fieldErrors.amount_dollars}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="subcategory_id">From which subcategory?</Label>
        <select
          id="subcategory_id"
          name="subcategory_id"
          required
          defaultValue=""
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Pick one…
          </option>
          {(["spend", "save", "share"] as const).map((k) =>
            byBucket[k].length > 0 ? (
              <optgroup key={k} label={k[0].toUpperCase() + k.slice(1)}>
                {byBucket[k].map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.emoji} {s.displayName} — {formatCents(s.balanceCents)}
                  </option>
                ))}
              </optgroup>
            ) : null,
          )}
        </select>
        {state.fieldErrors?.subcategory_id ? (
          <p className="text-sm text-destructive">{state.fieldErrors.subcategory_id}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note</Label>
        <Input id="note" name="note" type="text" placeholder="e.g. ice cream with friends" maxLength={280} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="occurred_at">When</Label>
        <Input id="occurred_at" name="occurred_at" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} />
      </div>

      {state.error ? (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
