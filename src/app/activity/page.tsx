import { requireUser } from "@/lib/auth/get-user";
import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCents, cn } from "@/lib/utils";
import Link from "next/link";
import { VoidButton } from "./void-button";

interface SearchParams {
  bucket?: string;
  source?: string;
}

const BUCKET_FILTERS = [
  { value: "", label: "All buckets" },
  { value: "spend", label: "Spend" },
  { value: "save", label: "Save" },
  { value: "share", label: "Share" },
] as const;

const PAGE_SIZE = 50;

const SIGN: Record<string, number> = {
  deposit: 1, spend: -1, interest: 1, opening_balance: 1, transfer: 1, adjustment: 1,
};

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireUser();
  const params = await searchParams;
  const bucketFilter = params.bucket ?? "";

  const supabase = await createClient();
  const { data: piggybank } = await supabase
    .from("piggybank")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (!piggybank) redirect("/onboarding/step-1");

  let query = supabase
    .from("transaction")
    .select(
      "id, kind, amount_cents, occurred_at, note, parent_id, source_type, voided_at, bucket(kind), subcategory(display_name, emoji), funder(display_name)",
    )
    .eq("piggybank_id", piggybank.id)
    .order("occurred_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (bucketFilter) {
    // Filter by bucket kind via a nested filter: select bucket where kind = X
    // Supabase doesn't support cross-table filtering directly through embed;
    // workaround: fetch bucket_id matching kind, then filter transactions.
    const { data: bucketIds } = await supabase
      .from("bucket")
      .select("id")
      .eq("piggybank_id", piggybank.id)
      .eq("kind", bucketFilter);
    const ids = (bucketIds ?? []).map((b) => b.id);
    if (ids.length > 0) {
      query = query.in("bucket_id", ids);
    } else {
      query = query.eq("bucket_id", "00000000-0000-0000-0000-000000000000"); // no match
    }
  }

  const { data: rows } = await query;

  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-3xl">Activity</h1>
          <p className="text-sm text-ink-muted mt-1">
            Every deposit, spend, and adjustment. Showing latest {PAGE_SIZE}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {BUCKET_FILTERS.map((f) => (
            <Link
              key={f.value}
              href={f.value ? `/activity?bucket=${f.value}` : "/activity"}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition",
                bucketFilter === f.value
                  ? "bg-brand text-white"
                  : "bg-line-soft text-ink-muted hover:bg-line",
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {(rows ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-10 text-center text-ink-muted">
            No activity {bucketFilter ? `in ${bucketFilter}` : "yet"}.
          </div>
        ) : (
          <ul className="rounded-2xl bg-card border border-line-soft divide-y divide-line-soft">
            {(rows ?? []).map((r) => {
              const sub = (r.subcategory as { display_name?: string; emoji?: string } | null) ?? null;
              const bucket = (r.bucket as { kind?: string } | null) ?? null;
              const funder = (r.funder as { display_name?: string } | null) ?? null;
              const sign = SIGN[r.kind as string] ?? 0;
              const signed = sign * (r.amount_cents ?? 0);
              const voided = r.voided_at != null;
              const isParent = r.parent_id == null && r.kind === "deposit";
              return (
                <li key={r.id} className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-line-soft flex items-center justify-center text-lg shrink-0">
                    {sub?.emoji ?? (r.kind === "deposit" ? "💵" : r.kind === "spend" ? "🛒" : r.kind === "adjustment" ? "🔧" : "·")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-medium truncate", voided && "line-through text-ink-muted")}>
                      {r.note || sub?.display_name || (funder?.display_name ? `${r.source_type ?? "Deposit"} from ${funder.display_name}` : r.kind)}
                    </div>
                    <div className="text-xs text-ink-muted">
                      {new Date(r.occurred_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      {bucket?.kind ? ` · ${bucket.kind}` : ""}
                      {isParent ? ` · distributed` : ""}
                    </div>
                  </div>
                  <div className={cn("font-data font-semibold tnum text-sm", voided ? "line-through text-ink-muted" : signed > 0 ? "text-share" : "text-ink")}>
                    {signed > 0 ? "+" : "−"} {formatCents(Math.abs(signed))}
                  </div>
                  <VoidButton
                    transactionId={r.id}
                    isVoided={voided}
                    rowSummary={`${r.note || sub?.display_name || r.kind} — ${formatCents(r.amount_cents ?? 0)}`}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
