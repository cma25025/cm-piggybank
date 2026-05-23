"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/get-user";
import {
  KidProfileSchema,
  DistributionSchema,
  ChangePasswordSchema,
  DeletePiggybankSchema,
} from "@/lib/settings/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function fieldErrorsFrom(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
) {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0]?.toString() ?? "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

async function getActivePiggybankId(): Promise<{
  id: string;
  kid_profile_id: string;
} | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("piggybank")
    .select("id, kid_profile_id")
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
};

export async function updateKidProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = KidProfileSchema.safeParse({
    display_name: formData.get("display_name"),
    age: formData.get("age"),
    avatar_emoji: formData.get("avatar_emoji") || "🐷",
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  await requireUser();
  const pb = await getActivePiggybankId();
  if (!pb) return { error: "No active piggybank." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("kid_profile")
    .update({
      display_name: parsed.data.display_name,
      age: parsed.data.age,
      avatar_emoji: parsed.data.avatar_emoji,
    })
    .eq("id", pb.kid_profile_id);
  if (error) {
    console.error("updateKidProfileAction", error.message);
    return { error: "Couldn't save kid profile. Please try again." };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateDistributionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = DistributionSchema.safeParse({
    spend_pct: formData.get("spend_pct"),
    save_pct: formData.get("save_pct"),
    share_pct: formData.get("share_pct"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  await requireUser();
  const pb = await getActivePiggybankId();
  if (!pb) return { error: "No active piggybank." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("distribution_rule")
    .update({
      spend_bps: parsed.data.spend_pct * 100,
      save_bps: parsed.data.save_pct * 100,
      share_bps: parsed.data.share_pct * 100,
    })
    .eq("piggybank_id", pb.id);
  if (error) {
    console.error("updateDistributionAction", error.message);
    return { error: "Couldn't save split. Please try again." };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = ChangePasswordSchema.safeParse({
    new_password: formData.get("new_password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.new_password });
  if (error) {
    console.error("changePasswordAction", error.message);
    return { error: error.message };
  }

  // Supabase rotates the JWT — sign out so other tabs forcibly re-auth.
  await supabase.auth.signOut();
  redirect("/login?reset=ok");
}

export async function softDeletePiggybankAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = DeletePiggybankSchema.safeParse({
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const user = await requireUser();
  const pb = await getActivePiggybankId();
  if (!pb) return { error: "No active piggybank." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("soft_delete_piggybank", {
    p_piggybank_id: pb.id,
  });
  if (error) {
    console.error("softDeletePiggybankAction", error.message);
    return { error: "Couldn't delete the piggybank. Please try again." };
  }

  // Sign out — they have no active piggybank now, future sessions will
  // redirect them to onboarding (which would create a new kid). Cleaner
  // to log out and let them decide consciously what to do next.
  await supabase.auth.signOut();
  redirect(`/login?deleted=ok&restorable_for=30d`);
}
