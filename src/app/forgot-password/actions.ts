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
  // Operator precedence: previous version was `(origin ?? host) ? https://${host} : ""`
  // which always used host even when origin was set. Rewrite explicitly.
  const originHdr = hdrs.get("origin");
  const hostHdr = hdrs.get("host");
  const baseUrl = originHdr ?? (hostHdr ? `https://${hostHdr}` : "");

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${baseUrl}/auth/callback?next=/reset-password`,
  });

  if (error) {
    console.error("forgotPasswordAction", error.message);
    // Uniform success message: don't leak whether the email exists.
  }

  // Always render success — prevents email enumeration.
  return { sent: true };
}
