"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateKidProfileAction, type ActionState } from "./actions";

const INITIAL: ActionState = {};
const EMOJI_OPTIONS = ["🐷", "🐶", "🐱", "🦊", "🐼", "🦁", "🐯", "🐸"];

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save"}
    </Button>
  );
}

interface Props {
  initialName: string;
  initialAge: number;
  initialEmoji: string;
}

export function KidProfileForm({ initialName, initialAge, initialEmoji }: Props) {
  const [state, formAction] = useFormState(updateKidProfileAction, INITIAL);
  const [emoji, setEmoji] = useState(initialEmoji);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="kid-name">Kid&apos;s name</Label>
        <Input
          id="kid-name"
          name="display_name"
          defaultValue={initialName}
          required
          maxLength={60}
        />
        {state.fieldErrors?.display_name ? (
          <p className="text-sm text-destructive">{state.fieldErrors.display_name}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="kid-age">Age</Label>
        <Input
          id="kid-age"
          name="age"
          type="number"
          min={0}
          max={25}
          defaultValue={initialAge}
          required
          className="w-24"
        />
        {state.fieldErrors?.age ? (
          <p className="text-sm text-destructive">{state.fieldErrors.age}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label>Avatar</Label>
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
      {state.success ? (
        <p className="text-sm text-spend">Saved.</p>
      ) : null}
      <Submit />
    </form>
  );
}
