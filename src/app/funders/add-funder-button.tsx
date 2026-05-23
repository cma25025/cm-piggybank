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
import { addFunderAction, type FunderActionState } from "./actions";

const INITIAL: FunderActionState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Adding..." : "Add funder"}
    </Button>
  );
}

export function AddFunderButton() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(addFunderAction, INITIAL);

  useEffect(() => {
    // Deps on whole `state` (object identity), not primitive .success —
    // a second consecutive success would otherwise short-circuit Object.is
    // and the dialog wouldn't auto-close on subsequent submits.
    if (state.success) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>＋ Add funder</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a funder</DialogTitle>
          <DialogDescription>
            Who else contributes money? Grandma, aunts, anyone. Tag deposits later by funder
            so you see who&apos;s contributed.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-display-name">Name</Label>
            <Input
              id="add-display-name"
              name="display_name"
              placeholder="Grandma"
              required
              maxLength={80}
              autoFocus
            />
            {state.fieldErrors?.display_name ? (
              <p className="text-sm text-destructive">{state.fieldErrors.display_name}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-relationship">Relationship (optional)</Label>
            <Input
              id="add-relationship"
              name="relationship"
              placeholder="mom's mom"
              maxLength={40}
            />
          </div>
          {state.error ? (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Submit />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
