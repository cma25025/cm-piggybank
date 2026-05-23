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
import { ExportButton } from "./export-button";
import { softDeletePiggybankAction, type ActionState } from "./actions";

const INITIAL: ActionState = {};

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending || disabled}>
      {pending ? "Deleting..." : "Delete piggybank"}
    </Button>
  );
}

export function DeletePiggybankDialog() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [state, formAction] = useFormState(softDeletePiggybankAction, INITIAL);

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/5">
          Delete piggybank
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this piggybank?</DialogTitle>
          <DialogDescription>
            <span className="block">
              We&apos;ll soft-delete and you&apos;ll be signed out. The data is{" "}
              <strong>restorable for 30 days</strong> via Supabase support
              (email and we&apos;ll flip the flag).
            </span>
            <span className="block mt-3">
              Want a backup first? Export your data — JSON, downloads instantly.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <ExportButton size="sm" />
          </div>

          <form action={formAction} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                Type <span className="font-mono font-bold">DELETE</span> to confirm
              </Label>
              <Input
                id="delete-confirm"
                name="confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="off"
              />
              {state.fieldErrors?.confirm ? (
                <p className="text-sm text-destructive">{state.fieldErrors.confirm}</p>
              ) : null}
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
              <Submit disabled={confirm !== "DELETE"} />
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
