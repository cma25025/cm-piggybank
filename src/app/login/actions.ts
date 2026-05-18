"use server";

import { createClient } from "@/lib/supabase/server";
import { LoginSchema } from "@/lib/auth/schemas";
import { redirect } from "next/navigation";

export type LoginState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0]?.toString() ?? "form";
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return { fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    console.error("loginAction", error.message);
    // Don't leak whether the email exists; uniform error.
    return { error: "Invalid email or password." };
  }

  const nextParam = formData.get("next");
  // Validate strictly: must start with single "/" and not "//" (open-redirect
  // protection — `//evil.com` is a valid absolute-protocol-relative URL that
  // bypasses startsWith("/") alone).
  const next =
    typeof nextParam === "string" &&
    nextParam.startsWith("/") &&
    !nextParam.startsWith("//") &&
    !nextParam.startsWith("/\\")
      ? nextParam
      : "/dashboard";
  redirect(next);
}
