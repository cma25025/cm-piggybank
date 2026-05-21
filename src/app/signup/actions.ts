"use server";

import { createClient } from "@/lib/supabase/server";
import { SignupSchema } from "@/lib/auth/schemas";
import { redirect } from "next/navigation";

export type SignupState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function signupAction(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const parsed = SignupSchema.safeParse({
    email: formData.get("email"),
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
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    console.error("signupAction", error.message);
    // Production: uniform error (no enumeration). Dev: surface the real
    // message so beta debug is possible without crawling Vercel logs.
    if (process.env.NODE_ENV === "development") {
      return { error: `[dev] ${error.message}` };
    }
    return { error: "Couldn't create the account. Try a different email or sign in." };
  }

  // Email confirmation is disabled in beta (Supabase Auth → Email Confirmations
  // off). With it off, signUp returns an active session and user is logged in.
  redirect("/onboarding");
}
