"use server";

import { createClient } from "@/lib/supabase/server";
import { ForgotPasswordSchema } from "@/lib/auth/schemas";
import { headers } from "next/headers";

export type ForgotPasswordState = {
  sent?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = ForgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: { email: parsed.error.issues[0]?.message ?? "Invalid email" } };
  }

  const supabase = await createClient();
  const hdrs = await headers();
  const origin = hdrs.get("origin") ?? hdrs.get("host") ? `https://${hdrs.get("host")}` : "";

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    console.error("forgotPasswordAction", error.message);
    // Uniform success message: don't leak whether the email exists.
  }

  // Always render success — prevents email enumeration.
  return { sent: true };
}
