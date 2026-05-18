"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupAction, type SignupState } from "./actions";

const INITIAL: SignupState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Creating account..." : "Create account"}
    </Button>
  );
}

export default function SignupPage() {
  const [state, formAction] = useFormState(signupAction, INITIAL);

  return (
    <AuthShell
      title="Create your account"
      subtitle="Set up your kid's piggybank in under two minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-brand-deep font-medium hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
          {state.fieldErrors?.email ? (
            <p className="text-sm text-destructive">{state.fieldErrors.email}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
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
