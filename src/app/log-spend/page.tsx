import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { LogSpendForm } from "./log-spend-form";

export default async function LogSpendPage() {
  await requireUser();
  const supabase = await createClient();
  const { data: pb } = await supabase
    .from("piggybank")
    .select("id")
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (!pb) redirect("/onboarding/step-1");

  const { data: subs } = await supabase
    .from("subcategory")
    .select("id, display_name, emoji, balance_cents, bucket(kind)")
    .eq("piggybank_id", pb.id)
    .is("archived_at", null)
    .order("display_name", { ascending: true });

  const groupedSubs = (subs ?? []).map((s) => {
    const bucket = (Array.isArray(s.bucket) ? s.bucket[0] : s.bucket) as
      | { kind?: "spend" | "save" | "share" }
      | null;
    return {
      id: s.id,
      displayName: s.display_name,
      emoji: s.emoji,
      balanceCents: s.balance_cents ?? 0,
      bucketKind: (bucket?.kind ?? "spend") as "spend" | "save" | "share",
    };
  });

  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-xl mx-auto">
        <Link href="/dashboard" className="text-sm text-ink-muted hover:text-ink">
          ← Dashboard
        </Link>
        <div className="mt-6 rounded-3xl bg-card border border-line-soft p-6 sm:p-8 shadow-sm">
          <h1 className="font-display text-2xl mb-1">Log a spend</h1>
          <p className="text-sm text-ink-muted mb-6">
            Cash going out. Pick where it came from.
          </p>
          <LogSpendForm subs={groupedSubs} />
        </div>
      </div>
    </AppShell>
  );
}
