import Link from "next/link";
import { getUser } from "@/lib/auth/get-user";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function Home() {
  // Signed-in caretakers go straight to their dashboard.
  const user = await getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="text-7xl" aria-hidden>🐷</div>
      <h1 className="font-display text-5xl text-brand-deep tracking-tight">
        CM Piggybank
      </h1>
      <p className="text-ink-muted max-w-md text-base">
        A custodial ledger for the cash on the kitchen counter. Teach kids where
        money goes; keep the grown-up in control.
      </p>
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        <Button asChild size="lg">
          <Link href="/signup">Create an account</Link>
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
      <p className="text-xs text-ink-muted mt-8 max-w-sm">
        Beta build. Email + password auth via Supabase; zero ongoing cost during
        the co-developer cohort.
      </p>
    </main>
  );
}
