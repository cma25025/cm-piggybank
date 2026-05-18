"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/get-user";
import { revalidatePath } from "next/cache";

const AddSubSchema = z.object({
  bucket_id: z.string().uuid(),
  display_name: z.string().trim().min(1, "Name is required").max(60),
  emoji: z.string().trim().min(1).max(8).default("🪙"),
  bucket_kind: z.enum(["spend", "save", "share"]),
});

export type AddSubState = { error?: string; fieldErrors?: Record<string, string> };

export async function addSubAction(
  _prev: AddSubState,
  formData: FormData,
): Promise<AddSubState> {
  const parsed = AddSubSchema.safeParse({
    bucket_id: formData.get("bucket_id"),
    display_name: formData.get("display_name"),
    emoji: formData.get("emoji") || "🪙",
    bucket_kind: formData.get("bucket_kind"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0]?.toString() ?? "form";
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return { fieldErrors };
  }

  await requireUser();
  const supabase = await createClient();

  // Read piggybank_id from the bucket (validation trigger ensures consistency).
  const { data: bucket } = await supabase
    .from("bucket")
    .select("piggybank_id")
    .eq("id", parsed.data.bucket_id)
    .single();
  if (!bucket) return { error: "Bucket not found." };

  const { error } = await supabase.from("subcategory").insert({
    bucket_id: parsed.data.bucket_id,
    piggybank_id: bucket.piggybank_id,
    display_name: parsed.data.display_name,
    emoji: parsed.data.emoji,
  });
  if (error) {
    console.error("addSubAction", error.message);
    return { error: "Couldn't add the subcategory." };
  }

  revalidatePath(`/buckets/${parsed.data.bucket_kind}`);
  return {};
}

const ArchiveSchema = z.object({
  sub_id: z.string().uuid(),
  bucket_kind: z.enum(["spend", "save", "share"]),
});

export type ArchiveState = { error?: string };

export async function archiveSubAction(
  _prev: ArchiveState,
  formData: FormData,
): Promise<ArchiveState> {
  const parsed = ArchiveSchema.safeParse({
    sub_id: formData.get("sub_id"),
    bucket_kind: formData.get("bucket_kind"),
  });
  if (!parsed.success) return { error: "Bad request." };

  await requireUser();
  const supabase = await createClient();

  // Reject archive when balance != 0 (OV4 — pro-explicit semantics).
  const { data: sub } = await supabase
    .from("subcategory")
    .select("balance_cents, display_name")
    .eq("id", parsed.data.sub_id)
    .single();
  if (!sub) return { error: "Subcategory not found." };
  if ((sub.balance_cents ?? 0) !== 0) {
    return {
      error: `${sub.display_name} still has money in it. Spend it down before archiving.`,
    };
  }

  const { error } = await supabase
    .from("subcategory")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", parsed.data.sub_id);
  if (error) {
    console.error("archiveSubAction", error.message);
    return { error: "Couldn't archive the subcategory." };
  }

  revalidatePath(`/buckets/${parsed.data.bucket_kind}`);
  return {};
}
