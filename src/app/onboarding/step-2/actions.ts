"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/get-user";
import { getOnboardingState } from "@/lib/onboarding/state";
import { redirect } from "next/navigation";

const Schema = z
  .object({
    spend_pct: z.coerce.number().int().min(0).max(100),
    save_pct: z.coerce.number().int().min(0).max(100),
    share_pct: z.coerce.number().int().min(0).max(100),
  })
  .refine((d) => d.spend_pct + d.save_pct + d.share_pct === 100, {
    message: "Percentages must add up to 100",
    path: ["spend_pct"],
  });

export type Step2State = { error?: string; fieldErrors?: Record<string, string> };

export async function updateSplitAction(
  _prev: Step2State,
  formData: FormData,
): Promise<Step2State> {
  const parsed = Schema.safeParse({
    spend_pct: formData.get("spend_pct"),
    save_pct: formData.get("save_pct"),
    share_pct: formData.get("share_pct"),
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
  const { error } = await supabase
    .from("distribution_rule")
    .update({
      spend_bps: parsed.data.spend_pct * 100,
      save_bps: parsed.data.save_pct * 100,
      share_bps: parsed.data.share_pct * 100,
    })
    .eq("piggybank_id", state.piggybankId);

  if (error) {
    console.error("updateSplitAction", error.message);
    return { error: "Couldn't save the split. Please try again." };
  }

  redirect("/onboarding/step-3");
}
