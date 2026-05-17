"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPiggybank(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const goalDollars = parseFloat(formData.get("goal") as string);
  const goal_amount = Math.round(goalDollars * 100);

  await supabase.from("piggybanks").insert({
    user_id: user.id,
    name,
    description,
    goal_amount,
  });

  revalidatePath("/dashboard");
}

export async function addTransaction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const piggybank_id = formData.get("piggybank_id") as string;
  const dollars = parseFloat(formData.get("amount") as string);
  const type = formData.get("type") as string;
  const note = formData.get("note") as string;
  const amount = Math.round(dollars * 100) * (type === "withdraw" ? -1 : 1);

  await supabase.from("transactions").insert({
    piggybank_id,
    user_id: user.id,
    amount,
    note,
  });

  revalidatePath("/dashboard");
}

export async function deletePiggybank(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const id = formData.get("id") as string;

  await supabase.from("piggybanks").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/dashboard");
}
