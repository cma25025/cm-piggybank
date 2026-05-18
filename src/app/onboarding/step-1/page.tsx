"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { StepShell } from "@/components/onboarding/step-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createKidProfileAction, type Step1State } from "./actions";

const INITIAL: Step1State = {};
const EMOJI_OPTIONS = ["🐷", "🐶", "🐱", "🦊", "🐼", "🦁", "🐯", "🐸"];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Creating piggybank..." : "Continue"}
    </Button>
  );
}

export default function Step1Page() {
  const [state, formAction] = useFormState(createKidProfileAction, INITIAL);
  const [emoji, setEmoji] = useState("🐷");

  return (
    <StepShell
      step={1}
      title="Who's the piggybank for?"
      subtitle="Tell us about the kid this piggybank belongs to."
    >
      <form action={formAction} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="display_name">Kid's name</Label>
          <Input
            id="display_name"
            name="display_name"
            type="text"
            placeholder="Maya"
            required
            maxLength={60}
            autoFocus
          />
          {state.fieldErrors?.display_name ? (
            <p className="text-sm text-destructive">{state.fieldErrors.display_name}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            name="age"
            type="number"
            min={0}
            max={25}
            placeholder="11"
            required
            className="w-24"
          />
          {state.fieldErrors?.age ? (
            <p className="text-sm text-destructive">{state.fieldErrors.age}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>Pick an avatar</Label>
          <input type="hidden" name="avatar_emoji" value={emoji} />
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={
                  "w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition " +
                  (e === emoji
                    ? "bg-brand-soft border-2 border-brand"
                    : "bg-line-soft border-2 border-transparent hover:bg-line")
                }
                aria-pressed={e === emoji}
                aria-label={`Use ${e} as avatar`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {state.error ? (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
            {state.error}
          </p>
        ) : null}

        <SubmitButton />
      </form>
    </StepShell>
  );
}
