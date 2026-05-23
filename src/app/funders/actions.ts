"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/get-user";
import {
  AddFunderSchema,
  EditFunderSchema,
  ArchiveFunderSchema,
} from "@/lib/funders/schemas";
import { escapeLike } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export type FunderActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
};

async function getActivePiggybankId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("piggybank")
    .select("id")
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

function fieldErrorsFrom(issues: readonly { path: readonly PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0]?.toString() ?? "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function addFunderAction(
  _prev: FunderActionState,
  formData: FormData,
): Promise<FunderActionState> {
  const parsed = AddFunderSchema.safeParse({
    display_name: formData.get("display_name"),
    relationship: formData.get("relationship"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  await requireUser();
  const piggybankId = await getActivePiggybankId();
  if (!piggybankId) return { error: "No active piggybank." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("find_or_create_funder", {
    p_piggybank_id: piggybankId,
    p_display_name: parsed.data.display_name,
    p_relationship: parsed.data.relationship,
  });
  if (error) {
    console.error("addFunderAction", error.message);
    return { error: "Couldn't add the funder. Please try again." };
  }

  revalidatePath("/funders");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function editFunderAction(
  _prev: FunderActionState,
  formData: FormData,
): Promise<FunderActionState> {
  const parsed = EditFunderSchema.safeParse({
    funder_id: formData.get("funder_id"),
    display_name: formData.get("display_name"),
    relationship: formData.get("relationship"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  await requireUser();
  const supabase = await createClient();

  // Read the current funder so we can detect case-insensitive name collisions
  // before Postgres raises a 23505 on the partial unique index.
  const { data: existing } = await supabase
    .from("funder")
    .select("id, piggybank_id, display_name")
    .eq("id", parsed.data.funder_id)
    .maybeSingle();
  if (!existing) return { error: "Funder not found." };

  const nameChanged =
    existing.display_name.toLowerCase() !== parsed.data.display_name.toLowerCase();
  if (nameChanged) {
    const { data: collision } = await supabase
      .from("funder")
      .select("id")
      .eq("piggybank_id", existing.piggybank_id)
      .is("archived_at", null)
      .ilike("display_name", escapeLike(parsed.data.display_name))
      .neq("id", parsed.data.funder_id)
      .maybeSingle();
    if (collision) {
      return {
        fieldErrors: {
          display_name: `Another funder named "${parsed.data.display_name}" already exists.`,
        },
      };
    }
  }

  const { error } = await supabase
    .from("funder")
    .update({
      display_name: parsed.data.display_name,
      relationship: parsed.data.relationship,
    })
    .eq("id", parsed.data.funder_id);
  if (error) {
    console.error("editFunderAction", error.message);
    return { error: "Couldn't save the funder. Please try again." };
  }

  revalidatePath("/funders");
  revalidatePath(`/funders/${parsed.data.funder_id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function archiveFunderAction(
  _prev: FunderActionState,
  formData: FormData,
): Promise<FunderActionState> {
  const parsed = ArchiveFunderSchema.safeParse({ funder_id: formData.get("funder_id") });
  if (!parsed.success) return { error: "Bad request." };

  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("funder")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", parsed.data.funder_id);
  if (error) {
    console.error("archiveFunderAction", error.message);
    return { error: "Couldn't archive the funder. Please try again." };
  }

  revalidatePath("/funders");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function unarchiveFunderAction(
  _prev: FunderActionState,
  formData: FormData,
): Promise<FunderActionState> {
  const parsed = ArchiveFunderSchema.safeParse({ funder_id: formData.get("funder_id") });
  if (!parsed.success) return { error: "Bad request." };

  await requireUser();
  const supabase = await createClient();

  // Need to verify no active funder shares this name first (case-insensitive)
  const { data: funder } = await supabase
    .from("funder")
    .select("id, piggybank_id, display_name")
    .eq("id", parsed.data.funder_id)
    .maybeSingle();
  if (!funder) return { error: "Funder not found." };

  const { data: collision } = await supabase
    .from("funder")
    .select("id")
    .eq("piggybank_id", funder.piggybank_id)
    .is("archived_at", null)
    .ilike("display_name", escapeLike(funder.display_name))
    .maybeSingle();
  if (collision) {
    return {
      error: `An active funder named "${funder.display_name}" already exists. Rename or archive that one first.`,
    };
  }

  const { error } = await supabase
    .from("funder")
    .update({ archived_at: null })
    .eq("id", parsed.data.funder_id);
  if (error) {
    console.error("unarchiveFunderAction", error.message);
    return { error: "Couldn't restore the funder. Please try again." };
  }

  revalidatePath("/funders");
  revalidatePath("/dashboard");
  return { success: true };
}
