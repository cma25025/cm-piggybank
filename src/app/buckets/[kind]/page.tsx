import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/get-user";
import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/server";
import { formatCents, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SubManagement } from "./sub-management";

const VALID_KINDS = new Set(["spend", "save", "share"]);

const META = {
  spend: { label: "Spend", emoji: "🛒", color: "text-spend", soft: "bg-spend-soft" },
  save: { label: "Save", emoji: "💰", color: "text-save", soft: "bg-save-soft" },
  share: { label: "Share", emoji: "💝", color: "text-share", soft: "bg-share-soft" },
} as const;

export default async function BucketPage({
  params,
}: {
  params: Promise<{ kind: string }>;
}) {
  const { kind } = await params;
  if (!VALID_KINDS.has(kind)) notFound();
  const bucketKind = kind as "spend" | "save" | "share";

  await requireUser();
  const supabase = await createClient();

  const { data: piggybank } = await supabase
    .from("piggybank")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (!piggybank) redirect("/onboarding/step-1");

  const { data: bucket } = await supabase
    .from("bucket")
    .select("id, balance_cents")
    .eq("piggybank_id", piggybank.id)
    .eq("kind", bucketKind)
    .maybeSingle();
  if (!bucket) notFound();

  const { data: subs } = await supabase
    .from("subcategory")
    .select("id, display_name, emoji, balance_cents, target_amount_cents, archived_at")
    .eq("bucket_id", bucket.id)
    .order("archived_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true });

  const meta = META[bucketKind];

  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
        <Link href="/dashboard" className="text-sm text-ink-muted hover:text-ink">
          ← Dashboard
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-2xl", meta.soft)}>
            {meta.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className={cn("font-display text-3xl font-bold", meta.color)}>{meta.label}</h1>
            <div className="font-display font-bold text-2xl tnum">
              {formatCents(bucket.balance_cents ?? 0)}
            </div>
          </div>
          <Button asChild>
            <Link href={`/log-spend?bucket=${bucketKind}`}>− Log spend</Link>
          </Button>
        </div>

        <SubManagement
          bucketId={bucket.id}
          bucketKind={bucketKind}
          subs={(subs ?? []).map((s) => ({
            id: s.id,
            displayName: s.display_name,
            emoji: s.emoji,
            balanceCents: s.balance_cents ?? 0,
            targetAmountCents: s.target_amount_cents ?? null,
            archivedAt: s.archived_at,
          }))}
        />
      </div>
    </AppShell>
  );
}
