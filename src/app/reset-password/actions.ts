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
  // The reset link's callback established a session; updateUser uses it.
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    console.error("resetPasswordAction", error.message);
    return { error: error.message };
  }

  redirect("/dashboard");
}
