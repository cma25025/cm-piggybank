"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addFunderAction, type Step3State } from "./actions";

const INITIAL: Step3State = {};

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant="ghost" size="sm">
      {pending ? "Adding..." : "＋ Add"}
    </Button>
  );
}

export function AddFunderForm() {
  const [state, formAction] = useFormState(addFunderAction, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset the form after a successful add (no fieldErrors, no error)
  useEffect(() => {
    if (!state.error && !state.fieldErrors) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form action={formAction} ref={formRef} className="space-y-3 rounded-xl border-2 border-dashed border-line p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="display_name" className="text-xs">Name</Label>
          <Input
            id="display_name"
            name="display_name"
            placeholder="Grandma"
            required
            maxLength={60}
          />
          {state.fieldErrors?.display_name ? (
            <p className="text-xs text-destructive">{state.fieldErrors.display_name}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="relationship" className="text-xs">Relationship (optional)</Label>
          <Input id="relationship" name="relationship" placeholder="mom's mom" maxLength={40} />
        </div>
      </div>
      {state.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}
      <div className="flex justify-end">
        <AddButton />
      </div>
    </form>
  );
}
