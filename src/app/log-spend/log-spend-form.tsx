"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatCents } from "@/lib/utils";
import { logSpendAction, type LogSpendState } from "./actions";

/**
 * "YYYY-MM-DDTHH:MM" for now() in the BROWSER's local tz. datetime-local
 * displays whatever string you give it as local time; UTC suffix causes
 * a timezone-shift bug.
 */
function nowLocalForInput(): string {
  const d = new Date();
  const offsetMin = d.getTimezoneOffset();
  return new Date(d.getTime() - offsetMin * 60_000).toISOString().slice(0, 16);
}

const INITIAL: LogSpendState = {};

interface Sub {
  id: string;
  displayName: string;
  emoji: string;
  balanceCents: number;
}

interface Props {
  bucketId: string;
  bucketKind: "spend" | "save" | "share";
  bucketBalanceCents: number;
  subs: Sub[];
}

const BUCKET_LABEL: Record<Props["bucketKind"], string> = {
  spend: "Spend",
  save: "Save",
  share: "Share",
};

function SubmitButton({ kind }: { kind: Props["bucketKind"] }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Recording..." : `Log spend from ${BUCKET_LABEL[kind]}`}
    </Button>
  );
}

export function LogSpendForm({ bucketId, bucketKind, bucketBalanceCents, subs }: Props) {
  const [state, formAction] = useFormState(logSpendAction, INITIAL);
  const [whenLocal, setWhenLocal] = useState(nowLocalForInput);
  const [subId, setSubId] = useState<string | "">("");

  // Convert local datetime string to a UTC ISO string for the server.
  const occurredAtISO = whenLocal ? new Date(whenLocal).toISOString() : "";

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="bucket_id" value={bucketId} />

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
        <p className="text-xs text-ink-muted">
          Available in {BUCKET_LABEL[bucketKind]}: {formatCents(bucketBalanceCents)}
        </p>
        {state.fieldErrors?.amount_dollars ? (
          <p className="text-sm text-destructive">{state.fieldErrors.amount_dollars}</p>
        ) : null}
      </div>

      <fieldset className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <legend className="text-sm font-medium">Toward a goal? (optional)</legend>
          {subs.length === 0 ? (
            <span className="text-[11px] text-ink-muted">
              No goals yet in {BUCKET_LABEL[bucketKind]}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <SubTile
            id=""
            selected={subId === ""}
            onSelect={setSubId}
            label="No goal — just the category"
            emoji="·"
          />
          {subs.map((s) => (
            <SubTile
              key={s.id}
              id={s.id}
              selected={subId === s.id}
              onSelect={setSubId}
              label={s.displayName}
              emoji={s.emoji}
              balanceCents={s.balanceCents}
            />
          ))}
        </div>
        <input type="hidden" name="subcategory_id" value={subId} />
        {state.fieldErrors?.subcategory_id ? (
          <p className="text-sm text-destructive">{state.fieldErrors.subcategory_id}</p>
        ) : null}
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Input id="note" name="note" type="text" placeholder="e.g. ice cream with friends" maxLength={280} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="occurred_at_local">When</Label>
        <Input
          id="occurred_at_local"
          type="datetime-local"
          value={whenLocal}
          onChange={(e) => setWhenLocal(e.target.value)}
        />
        <input type="hidden" name="occurred_at" value={occurredAtISO} />
      </div>

      {state.error ? (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
          {state.error}
        </p>
      ) : null}

      <SubmitButton kind={bucketKind} />
    </form>
  );
}

function SubTile({
  id,
  selected,
  onSelect,
  label,
  emoji,
  balanceCents,
}: {
  id: string;
  selected: boolean;
  onSelect: (id: string) => void;
  label: string;
  emoji: string;
  balanceCents?: number;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={cn(
        "rounded-xl border-2 px-3 py-2 text-left flex items-center gap-2 transition",
        selected
          ? "bg-brand-soft border-brand"
          : "bg-card border-line-soft hover:border-line",
      )}
      aria-pressed={selected}
    >
      <span className="text-lg shrink-0" aria-hidden>
        {emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium truncate">{label}</span>
        {balanceCents != null ? (
          <span className="block text-[11px] text-ink-muted tnum">
            {formatCents(balanceCents)}
          </span>
        ) : null}
      </span>
    </button>
  );
}
