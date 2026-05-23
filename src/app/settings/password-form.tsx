"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction, type ActionState } from "./actions";

const INITIAL: ActionState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Updating..." : "Change password"}
    </Button>
  );
}

export function PasswordForm() {
  const [state, formAction] = useFormState(changePasswordAction, INITIAL);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new_password">New password</Label>
        <Input
          id="new_password"
          name="new_password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        {state.fieldErrors?.new_password ? (
          <p className="text-sm text-destructive">{state.fieldErrors.new_password}</p>
        ) : (
          <p className="text-xs text-ink-muted">At least 8 characters.</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
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
      <p className="text-xs text-ink-muted">
        You&apos;ll be signed out — other tabs need fresh login with the new password.
      </p>
      <Submit />
    </form>
  );
}
