"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type LoginState } from "./actions";

const INITIAL: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Signing in..." : "Sign in"}
    </Button>
  );
}

function LoginForm() {
  const [state, formAction] = useFormState(loginAction, INITIAL);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your piggybank."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="text-brand-deep font-medium hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
          {state.fieldErrors?.email ? (
            <p className="text-sm text-destructive">{state.fieldErrors.email}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-ink-muted hover:text-brand-deep hover:underline"
            >
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          {state.fieldErrors?.password ? (
            <p className="text-sm text-destructive">{state.fieldErrors.password}</p>
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Welcome back" subtitle="Sign in to your piggybank.">
          <div className="h-48" aria-hidden />
        </AuthShell>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
