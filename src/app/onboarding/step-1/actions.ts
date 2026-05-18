"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/get-user";
import { getOnboardingState } from "@/lib/onboarding/state";
import { redirect } from "next/navigation";

const Schema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(60, "Name is too long"),
  age: z.coerce
    .number()
    .int("Age must be a whole number")
    .min(0, "Age must be 0 or older")
    .max(25, "Age must be 25 or under"),
  avatar_emoji: z.string().trim().min(1).max(8).default("🐷"),
});

export type Step1State = { error?: string; fieldErrors?: Record<string, string> };

export async function createKidProfileAction(
  _prev: Step1State,
  formData: FormData,
): Promise<Step1State> {
  const parsed = Schema.safeParse({
    display_name: formData.get("display_name"),
    age: formData.get("age"),
    avatar_emoji: formData.get("avatar_emoji") || "🐷",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0]?.toString() ?? "form";
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return { fieldErrors };
  }

  // Idempotency guard: if this caretaker already has an active piggybank,
  // skip the RPC and go forward. v1 is single-piggybank-per-caretaker; re-running
  // step 1 would otherwise create orphan kid_profile + piggybank rows.
  const user = await requireUser();
  const existing = await getOnboardingState(user.id);
  if (existing.piggybankId) {
    redirect("/onboarding/step-2");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_piggybank_with_defaults", {
    p_kid_name: parsed.data.display_name,
    p_age: parsed.data.age,
    p_avatar_emoji: parsed.data.avatar_emoji,
  });

  if (error) {
    console.error("createKidProfileAction", error.message);
    return { error: "Couldn't create the piggybank. Please try again." };
  }

  redirect("/onboarding/step-2");
}
