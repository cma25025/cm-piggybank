"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { computeDistribution, type DistributionRule } from "@/lib/distribution";
import { formatCents } from "@/lib/utils";
import {
  submitFreshDepositAction,
  submitOpeningBalancesAction,
  type Step4State,
} from "./actions";

const INITIAL: Step4State = {};

function SubmitFresh() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Recording..." : "Add this deposit"}
    </Button>
  );
}
function SubmitMigrate() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Recording..." : "Save opening balances"}
    </Button>
  );
}

interface Props {
  funders: string[];
  rule: DistributionRule;
}

export function Step4Tabs({ funders, rule }: Props) {
  return (
    <Tabs defaultValue="fresh" className="space-y-5">
      <TabsList className="grid grid-cols-2 w-full">
        <TabsTrigger value="fresh">Starting fresh</TabsTrigger>
        <TabsTrigger value="migrate">I have a piggy bank already</TabsTrigger>
      </TabsList>

      <TabsContent value="fresh">
        <FreshDepositForm funders={funders} rule={rule} />
      </TabsContent>

      <TabsContent value="migrate">
        <OpeningBalancesForm />
      </TabsContent>
    </Tabs>
  );
}

function FreshDepositForm({ funders, rule }: { funders: string[]; rule: DistributionRule }) {
  const [state, formAction] = useFormState(submitFreshDepositAction, INITIAL);
  const [amountStr, setAmountStr] = useState("");
  const cents = (() => {
    const n = parseFloat(amountStr);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.round(n * 100);
  })();

  const preview = cents > 0 ? computeDistribution(cents, rule) : null;

  return (
    <form action={formAction} className="space-y-4">
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
        <Label htmlFor="source_type">Type</Label>
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
        <Input id="note" name="note" type="text" placeholder="e.g. birthday from grandpa" maxLength={280} />
      </div>

      {preview ? (
        <div className="rounded-xl border-2 border-brand-soft bg-brand-soft/40 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-brand-deep mb-2">
            Live preview
          </div>
          <div className="grid grid-cols-3 gap-2 tnum">
            <PreviewCell label="Spend" color="spend" cents={preview.spend_cents} />
            <PreviewCell label="Save" color="save" cents={preview.save_cents} />
            <PreviewCell label="Share" color="share" cents={preview.share_cents} />
          </div>
        </div>
      ) : null}

      {state.error ? (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
          {state.error}
        </p>
      ) : null}

      <SubmitFresh />
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
  const colorClass = {
    spend: "text-spend",
    save: "text-save",
    share: "text-share",
  }[color];
  return (
    <div className="bg-white rounded-lg p-2 text-center">
      <div className={`text-[11px] font-semibold uppercase ${colorClass}`}>{label}</div>
      <div className="font-display text-lg">{formatCents(cents)}</div>
    </div>
  );
}

function OpeningBalancesForm() {
  const [state, formAction] = useFormState(submitOpeningBalancesAction, INITIAL);

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-ink-muted">
        Enter the current cash in each bucket. We'll record these as starting balances —
        no auto-distribution.
      </p>

      <BalanceInput label="Spend" color="spend" name="spend_dollars" />
      <BalanceInput label="Save" color="save" name="save_dollars" />
      <BalanceInput label="Share" color="share" name="share_dollars" />

      {state.error ? (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
          {state.error}
        </p>
      ) : null}

      <SubmitMigrate />
    </form>
  );
}

function BalanceInput({
  label,
  color,
  name,
}: {
  label: string;
  color: "spend" | "save" | "share";
  name: string;
}) {
  const colorClasses = {
    spend: "bg-spend-soft border-spend/30",
    save: "bg-save-soft border-save/30",
    share: "bg-share-soft border-share/30",
  }[color];
  return (
    <div className={`rounded-xl border-2 ${colorClasses} p-3`}>
      <Label htmlFor={name} className="text-xs font-semibold uppercase tracking-wide">
        {label}
      </Label>
      <div className="relative mt-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">$</span>
        <Input
          id={name}
          name={name}
          type="number"
          step="0.01"
          min="0"
          defaultValue="0"
          className="pl-7 bg-white font-display text-lg tnum"
        />
      </div>
    </div>
  );
}
