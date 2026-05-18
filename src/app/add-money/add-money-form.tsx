"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { computeDistribution, type DistributionRule } from "@/lib/distribution";
import { formatCents } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addMoneyAction, type AddMoneyState } from "./actions";

const INITIAL: AddMoneyState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Recording..." : "Add money"}
    </Button>
  );
}

interface Props {
  rule: DistributionRule;
  funders: string[];
}

export function AddMoneyForm({ rule, funders }: Props) {
  const [state, formAction] = useFormState(addMoneyAction, INITIAL);
  const [amountStr, setAmountStr] = useState("");
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [manualSpend, setManualSpend] = useState("");
  const [manualSave, setManualSave] = useState("");
  const [manualShare, setManualShare] = useState("");

  const amountCents = (() => {
    const n = parseFloat(amountStr);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.round(n * 100);
  })();

  const autoPreview = amountCents > 0 ? computeDistribution(amountCents, rule) : null;
  const manualTotal =
    (parseFloat(manualSpend || "0") || 0) +
    (parseFloat(manualSave || "0") || 0) +
    (parseFloat(manualShare || "0") || 0);
  const manualValid = mode === "auto" || Math.abs(manualTotal * 100 - amountCents) < 0.5;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="mode" value={mode} />

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
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            autoFocus
          />
        </div>
        {state.fieldErrors?.amount_dollars ? (
          <p className="text-sm text-destructive">{state.fieldErrors.amount_dollars}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="funder_name">From whom</Label>
        <Input
          id="funder_name"
          name="funder_name"
          list="funder-options"
          placeholder="You / Grandma / etc."
          defaultValue={funders[0] ?? ""}
          required
          maxLength={60}
        />
        <datalist id="funder-options">
          {funders.map((f) => (
            <option key={f} value={f} />
          ))}
        </datalist>
      </div>

      <div className="space-y-2">
        <Label htmlFor="source_type">Source</Label>
        <select
          id="source_type"
          name="source_type"
          defaultValue="other"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="allowance">Allowance</option>
          <option value="birthday">Birthday</option>
          <option value="chores">Chores</option>
          <option value="gift">Gift</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Input id="note" name="note" type="text" placeholder="e.g. birthday from Grandpa" maxLength={280} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label>Distribution</Label>
          <div className="flex rounded-md bg-line-soft p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setMode("auto")}
              className={
                "px-3 py-1 rounded " +
                (mode === "auto" ? "bg-card text-ink shadow-sm" : "text-ink-muted")
              }
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={
                "px-3 py-1 rounded " +
                (mode === "manual" ? "bg-card text-ink shadow-sm" : "text-ink-muted")
              }
            >
              Manual
            </button>
          </div>
        </div>

        {mode === "auto" && autoPreview ? (
          <div className="rounded-xl border-2 border-brand-soft bg-brand-soft/40 p-3 grid grid-cols-3 gap-2 tnum">
            <PreviewCell label="Spend" color="spend" cents={autoPreview.spend_cents} />
            <PreviewCell label="Save" color="save" cents={autoPreview.save_cents} />
            <PreviewCell label="Share" color="share" cents={autoPreview.share_cents} />
          </div>
        ) : null}

        {mode === "manual" ? (
          <div className="grid grid-cols-3 gap-3">
            <BucketDollarInput label="Spend" color="spend" name="manual_spend" value={manualSpend} onChange={setManualSpend} />
            <BucketDollarInput label="Save" color="save" name="manual_save" value={manualSave} onChange={setManualSave} />
            <BucketDollarInput label="Share" color="share" name="manual_share" value={manualShare} onChange={setManualShare} />
          </div>
        ) : null}

        {mode === "manual" && amountCents > 0 ? (
          <p
            className={
              "text-xs " +
              (manualValid ? "text-share" : "text-destructive")
            }
          >
            Manual total: ${manualTotal.toFixed(2)} of ${(amountCents / 100).toFixed(2)}{" "}
            {manualValid ? "✓" : ""}
          </p>
        ) : null}
        {state.fieldErrors?.manual_spend ? (
          <p className="text-sm text-destructive">{state.fieldErrors.manual_spend}</p>
        ) : null}
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

function PreviewCell({
  label,
  color,
  cents,
}: {
  label: string;
  color: "spend" | "save" | "share";
  cents: number;
}) {
  const colorClass = { spend: "text-spend", save: "text-save", share: "text-share" }[color];
  return (
    <div className="bg-white rounded-lg p-2 text-center">
      <div className={`text-[11px] font-semibold uppercase ${colorClass}`}>{label}</div>
      <div className="font-display text-lg">{formatCents(cents)}</div>
    </div>
  );
}

function BucketDollarInput({
  label,
  color,
  name,
  value,
  onChange,
}: {
  label: string;
  color: "spend" | "save" | "share";
  name: string;
  value: string;
  onChange: (s: string) => void;
}) {
  const colorClasses = {
    spend: "bg-spend-soft border-spend/30",
    save: "bg-save-soft border-save/30",
    share: "bg-share-soft border-share/30",
  }[color];
  return (
    <div className={`rounded-xl border-2 ${colorClasses} p-2`}>
      <Label htmlFor={name} className="text-[11px] font-semibold uppercase tracking-wide">
        {label}
      </Label>
      <div className="relative mt-1">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-ink-muted">$</span>
        <Input
          id={name}
          name={name}
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-5 bg-white font-display text-lg tnum h-9"
          placeholder="0.00"
        />
      </div>
    </div>
  );
}
