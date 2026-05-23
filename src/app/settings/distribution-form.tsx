"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateDistributionAction, type ActionState } from "./actions";

const INITIAL: ActionState = {};

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? "Saving..." : "Save split"}
    </Button>
  );
}

interface Props {
  initialSpendPct: number;
  initialSavePct: number;
  initialSharePct: number;
}

export function DistributionForm({
  initialSpendPct,
  initialSavePct,
  initialSharePct,
}: Props) {
  const [state, formAction] = useFormState(updateDistributionAction, INITIAL);
  const [spend, setSpend] = useState(initialSpendPct);
  const [save, setSave] = useState(initialSavePct);
  const [share, setShare] = useState(initialSharePct);
  const total = spend + save + share;
  const valid = total === 100;

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <BucketInput name="spend_pct" label="Spend" color="spend" value={spend} onChange={setSpend} />
        <BucketInput name="save_pct" label="Save" color="save" value={save} onChange={setSave} />
        <BucketInput name="share_pct" label="Share" color="share" value={share} onChange={setShare} />
      </div>
      <div
        className={
          "text-center text-sm font-medium rounded-md p-2 " +
          (valid ? "bg-spend-soft text-spend" : "bg-destructive/10 text-destructive")
        }
      >
        {valid ? "Adds up to 100% ✓" : `Total: ${total}% — must equal 100%`}
      </div>
      {state.error ? (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
          {state.error}
        </p>
      ) : null}
      {state.success ? <p className="text-sm text-spend">Saved.</p> : null}
      <Submit disabled={!valid} />
    </form>
  );
}

function BucketInput({
  name,
  label,
  color,
  value,
  onChange,
}: {
  name: string;
  label: string;
  color: "spend" | "save" | "share";
  value: number;
  onChange: (n: number) => void;
}) {
  const colorClasses = {
    spend: "bg-spend-soft border-spend/30",
    save: "bg-save-soft border-save/30",
    share: "bg-share-soft border-share/30",
  }[color];
  return (
    <div className={`rounded-xl border-2 p-3 ${colorClasses}`}>
      <Label htmlFor={name} className="block text-xs font-semibold uppercase tracking-wide mb-1">
        {label}
      </Label>
      <div className="flex items-center gap-1">
        <Input
          id={name}
          name={name}
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value || "0", 10))}
          className="font-display text-xl text-center p-1 h-10 bg-white"
        />
        <span className="font-display text-lg text-ink-muted">%</span>
      </div>
    </div>
  );
}
