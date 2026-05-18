"use client";

import { useFormState, useFormStatus } from "react-dom";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction, type ResetPasswordState } from "./actions";

const INITIAL: ResetPasswordState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Updating..." : "Update password"}
    </Button>
  );
}

export default function ResetPasswordPage() {
  const [state, formAction] = useFormState(resetPasswordAction, INITIAL);

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password.">
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
          {state.fieldErrors?.password ? (
            <p className="text-sm text-destructive">{state.fieldErrors.password}</p>
          ) : (
            <p className="text-xs text-ink-muted">At least 8 characters.</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
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
        <SubmitButton />
      </form>
    </AuthShell>
  );
}
