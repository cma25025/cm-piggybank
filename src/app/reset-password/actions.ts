"use server";

import { createClient } from "@/lib/supabase/server";
import { ResetPasswordSchema } from "@/lib/auth/schemas";
import { redirect } from "next/navigation";

export type ResetPasswordState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = ResetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
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

  // Verify the session was established by a recovery (reset link) flow, not
  // a normal login. Supabase exposes the auth method via the user's amr
  // (authentication-methods-references) claim; "recovery" is the marker.
  // Without this check, any logged-in user could rotate their own password
  // without re-authenticating (stolen-laptop risk).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Reset link expired. Request a new one from the login screen." };
  }
  const amr = (user.app_metadata?.provider as string | undefined) ?? "";
  const amrEntries = (user as { amr?: { method?: string }[] }).amr ?? [];
  const isRecoverySession =
    amrEntries.some((e) => e.method === "recovery") || amr === "recovery";
  if (!isRecoverySession) {
    return {
      error: "This password reset is no longer active. Please request a new reset link.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    console.error("resetPasswordAction", error.message);
    return { error: error.message };
  }

  // Sign out so subsequent sessions require fresh login with the new password.
  await supabase.auth.signOut();
  redirect("/login?reset=ok");
}
