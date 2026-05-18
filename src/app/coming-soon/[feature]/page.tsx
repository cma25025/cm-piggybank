import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { COMING_SOON } from "@/lib/coming-soon-manifest";

export default async function ComingSoonPage({
  params,
}: {
  params: Promise<{ feature: string }>;
}) {
  const { feature } = await params;
  const item = COMING_SOON[feature];
  if (!item) notFound();

  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-2xl mx-auto">
        <Link href="/dashboard" className="text-sm text-ink-muted hover:text-ink">
          ← Dashboard
        </Link>
        <div className="mt-6 rounded-3xl border-2 border-dashed border-line p-10 text-center bg-card">
          <div className="text-6xl mb-4" aria-hidden>
            {item.emoji}
          </div>
          <h1 className="font-display text-2xl mb-2">{item.label}</h1>
          <p className="text-ink-muted max-w-md mx-auto">{item.description}</p>
          <div className="mt-6 inline-block rounded-full bg-brand-soft text-brand-deep text-xs font-semibold px-3 py-1 uppercase tracking-wide">
            Shipping {item.targetVersion}
          </div>
          <div className="mt-8">
            <Button asChild variant="ghost">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
