import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { cn, formatCents } from "@/lib/utils";
import { LogSpendForm } from "./log-spend-form";

const VALID_KINDS = new Set(["spend", "save", "share"]);

const BUCKET_TILES = [
  { kind: "spend" as const, label: "Spend", emoji: "🛒", color: "text-spend", soft: "bg-spend-soft" },
  { kind: "save" as const, label: "Save", emoji: "💰", color: "text-save", soft: "bg-save-soft" },
  { kind: "share" as const, label: "Share", emoji: "💝", color: "text-share", soft: "bg-share-soft" },
];

interface Bucket {
  id: string;
  kind: "spend" | "save" | "share";
  balanceCents: number;
}

export default async function LogSpendPage({
  searchParams,
}: {
  searchParams: Promise<{ bucket?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const requestedKind = params.bucket && VALID_KINDS.has(params.bucket)
    ? (params.bucket as "spend" | "save" | "share")
    : null;

  const supabase = await createClient();
  const { data: pb } = await supabase
    .from("piggybank")
    .select("id")
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (!pb) redirect("/onboarding/step-1");

  const [{ data: bucketsRaw }, { data: subsRaw }] = await Promise.all([
    supabase
      .from("bucket")
      .select("id, kind, balance_cents")
      .eq("piggybank_id", pb.id),
    supabase
      .from("subcategory")
      .select("id, display_name, emoji, balance_cents, bucket_id")
      .eq("piggybank_id", pb.id)
      .is("archived_at", null)
      .order("display_name", { ascending: true }),
  ]);

  const buckets: Bucket[] = (bucketsRaw ?? []).map((b) => ({
    id: b.id as string,
    kind: b.kind as "spend" | "save" | "share",
    balanceCents: Number(b.balance_cents ?? 0),
  }));

  const selectedBucket = requestedKind
    ? buckets.find((b) => b.kind === requestedKind) ?? null
    : null;

  const subsForSelected = selectedBucket
    ? (subsRaw ?? [])
        .filter((s) => s.bucket_id === selectedBucket.id)
        .map((s) => ({
          id: s.id as string,
          displayName: s.display_name as string,
          emoji: (s.emoji as string | null) ?? "·",
          balanceCents: Number(s.balance_cents ?? 0),
        }))
    : [];

  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-xl mx-auto">
        <Link href="/dashboard" className="text-sm text-ink-muted hover:text-ink">
          ← Dashboard
        </Link>

        <div className="mt-6 rounded-3xl bg-card border border-line-soft p-6 sm:p-8 shadow-sm space-y-6">
          <header>
            <h1 className="font-display text-2xl mb-1">Log a spend</h1>
            <p className="text-sm text-ink-muted">
              Cash going out. Pick a category, then add the details.
            </p>
          </header>

          <fieldset>
            <legend className="text-sm font-medium mb-2">Category</legend>
            <div className="grid grid-cols-3 gap-3">
              {BUCKET_TILES.map((t) => {
                const b = buckets.find((x) => x.kind === t.kind);
                const isActive = requestedKind === t.kind;
                const balance = b?.balanceCents ?? 0;
                return (
                  <Link
                    key={t.kind}
                    href={`/log-spend?bucket=${t.kind}`}
                    scroll={false}
                    className={cn(
                      "rounded-2xl border-2 p-3 text-center transition",
                      isActive
                        ? `${t.soft} border-current ${t.color}`
                        : "bg-card border-line-soft hover:border-line",
                    )}
                  >
                    <div className="text-2xl">{t.emoji}</div>
                    <div className={cn("text-sm font-semibold mt-1", isActive ? t.color : "text-ink")}>
                      {t.label}
                    </div>
                    <div className="text-[11px] text-ink-muted tnum mt-0.5">
                      {formatCents(balance)}
                    </div>
                  </Link>
                );
              })}
            </div>
          </fieldset>

          {selectedBucket ? (
            <LogSpendForm
              bucketId={selectedBucket.id}
              bucketKind={selectedBucket.kind}
              bucketBalanceCents={selectedBucket.balanceCents}
              subs={subsForSelected}
            />
          ) : (
            <p className="text-sm text-ink-muted bg-line-soft/40 rounded-xl px-3 py-3">
              Pick a category above to enter the spend details.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
