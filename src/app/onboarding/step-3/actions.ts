"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/get-user";
import { getOnboardingState } from "@/lib/onboarding/state";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const AddFunderSchema = z.object({
  display_name: z.string().trim().min(1, "Name is required").max(60),
  relationship: z.string().trim().max(40).optional().nullable(),
});

export type Step3State = { error?: string; fieldErrors?: Record<string, string> };

export async function addFunderAction(
  _prev: Step3State,
  formData: FormData,
): Promise<Step3State> {
  const parsed = AddFunderSchema.safeParse({
    display_name: formData.get("display_name"),
    relationship: formData.get("relationship") || null,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0]?.toString() ?? "form";
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return { fieldErrors };
  }

  const user = await requireUser();
  const state = await getOnboardingState(user.id);
  if (!state.piggybankId) {
    redirect("/onboarding/step-1");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("find_or_create_funder", {
    p_piggybank_id: state.piggybankId,
    p_display_name: parsed.data.display_name,
    p_relationship: parsed.data.relationship ?? null,
  });

  if (error) {
    console.error("addFunderAction", error.message);
    return { error: "Couldn't add the funder. Please try again." };
  }

  revalidatePath("/onboarding/step-3");
  return {};
}
