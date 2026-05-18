"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction, type ForgotPasswordState } from "./actions";

const INITIAL: ForgotPasswordState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Sending..." : "Send reset link"}
    </Button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useFormState(forgotPasswordAction, INITIAL);

  if (state.sent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="If that email exists, we sent a reset link. Click it to set a new password."
        footer={
          <Link href="/login" className="text-brand-deep font-medium hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div className="text-6xl text-center my-4" aria-hidden>
          📬
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <Link href="/login" className="text-brand-deep font-medium hover:underline">
          Back to sign in
        </Link>
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
        <SubmitButton />
      </form>
    </AuthShell>
  );
}
