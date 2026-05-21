"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { StepShell } from "@/components/onboarding/step-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSplitAction, type Step2State } from "./actions";

const INITIAL: Step2State = {};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} className="w-full">
      {pending ? "Saving..." : "Continue"}
    </Button>
  );
}

export default function Step2Page() {
  const [state, formAction] = useFormState(updateSplitAction, INITIAL);
  const [spend, setSpend] = useState(60);
  const [save, setSave] = useState(20);
  const [share, setShare] = useState(20);
  const total = spend + save + share;
  const valid = total === 100;

  return (
    <StepShell
      step={2}
      title="How should new money split?"
      subtitle="Every deposit auto-distributes into three buckets. You can change this anytime."
    >
      <form action={formAction} className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <BucketInput
            label="Spend"
            color="spend"
            value={spend}
            onChange={setSpend}
            name="spend_pct"
          />
          <BucketInput
            label="Save"
            color="save"
            value={save}
            onChange={setSave}
            name="save_pct"
          />
          <BucketInput
            label="Share"
            color="share"
            value={share}
            onChange={setShare}
            name="share_pct"
          />
        </div>

        <div
          className={
            "text-center text-sm font-medium rounded-md p-3 " +
            (valid
              ? "bg-spend-soft text-spend"
              : "bg-destructive/10 text-destructive")
          }
        >
          {valid ? "Adds up to 100% ✓" : `Total: ${total}% — must equal 100%`}
        </div>

        {state.error ? (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
            {state.error}
          </p>
        ) : null}

        <div className="flex gap-3">
          <Button type="button" variant="ghost" asChild className="flex-1">
            <Link href="/onboarding/step-3">Skip</Link>
          </Button>
          <div className="flex-[2]">
            <SubmitButton disabled={!valid} />
          </div>
        </div>
      </form>
    </StepShell>
  );
}

function BucketInput({
  label,
  color,
  value,
  onChange,
  name,
}: {
  label: string;
  color: "spend" | "save" | "share";
  value: number;
  onChange: (n: number) => void;
  name: string;
}) {
  const colorClasses = {
    spend: "bg-spend-soft border-spend/30",
    save: "bg-save-soft border-save/30",
    share: "bg-share-soft border-share/30",
  } as const;
  return (
    <div className={`rounded-xl border-2 p-3 ${colorClasses[color]}`}>
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
          className="font-display text-2xl text-center p-1 h-12 bg-white"
        />
        <span className="font-display text-xl text-ink-muted">%</span>
      </div>
    </div>
  );
}
