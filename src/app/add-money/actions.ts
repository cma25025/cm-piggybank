"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/get-user";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const Schema = z
  .object({
    amount_dollars: z.coerce.number().positive("Amount must be greater than 0").max(1_000_000),
    funder_name: z.string().trim().min(1, "Funder is required").max(60),
    funder_relationship: z.string().trim().max(40).optional().nullable(),
    source_type: z.enum(["allowance", "birthday", "chores", "gift", "other"]),
    note: z.string().trim().max(280).optional().nullable(),
    mode: z.enum(["auto", "manual"]),
    manual_spend: z.coerce.number().min(0).max(1_000_000).optional(),
    manual_save: z.coerce.number().min(0).max(1_000_000).optional(),
    manual_share: z.coerce.number().min(0).max(1_000_000).optional(),
  })
  .superRefine((d, ctx) => {
    if (d.mode === "manual") {
      const total = (d.manual_spend ?? 0) + (d.manual_save ?? 0) + (d.manual_share ?? 0);
      if (Math.abs(total - d.amount_dollars) > 0.0001) {
        ctx.addIssue({
          code: "custom",
          message: `Manual split must sum to ${d.amount_dollars.toFixed(2)}`,
          path: ["manual_spend"],
        });
      }
    }
  });

export type AddMoneyState = { error?: string; fieldErrors?: Record<string, string> };

function dollarsToCents(d: number): number {
  return Math.round(d * 100);
}

export async function addMoneyAction(
  _prev: AddMoneyState,
  formData: FormData,
): Promise<AddMoneyState> {
  const parsed = Schema.safeParse({
    amount_dollars: formData.get("amount_dollars"),
    funder_name: formData.get("funder_name"),
    funder_relationship: formData.get("funder_relationship") || null,
    source_type: formData.get("source_type"),
    note: formData.get("note") || null,
    mode: formData.get("mode"),
    manual_spend: formData.get("manual_spend") || undefined,
    manual_save: formData.get("manual_save") || undefined,
    manual_share: formData.get("manual_share") || undefined,
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
  const supabase = await createClient();
  const { data: pb } = await supabase
    .from("piggybank")
    .select("id")
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (!pb) return { error: "No piggybank found." };

  const distribution =
    parsed.data.mode === "manual"
      ? {
          spend: dollarsToCents(parsed.data.manual_spend ?? 0),
          save: dollarsToCents(parsed.data.manual_save ?? 0),
          share: dollarsToCents(parsed.data.manual_share ?? 0),
        }
      : null;

  const { error } = await supabase.rpc("add_deposit", {
    p_piggybank_id: pb.id,
    p_amount_cents: dollarsToCents(parsed.data.amount_dollars),
    p_funder_name: parsed.data.funder_name,
    p_source_type: parsed.data.source_type,
    p_note: parsed.data.note ?? null,
    p_funder_relationship: parsed.data.funder_relationship ?? null,
    p_distribution: distribution as never, // Supabase typed param is jsonb
  });

  if (error) {
    console.error("addMoneyAction", error.message);
    return { error: "Couldn't record the deposit. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/activity");
  revalidatePath("/buckets/spend");
  revalidatePath("/buckets/save");
  revalidatePath("/buckets/share");
  redirect("/dashboard");
}
