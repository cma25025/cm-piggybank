import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { LogoutButton } from "@/components/auth/logout-button";
import { KidProfileForm } from "./kid-profile-form";
import { DistributionForm } from "./distribution-form";
import { PasswordForm } from "./password-form";
import { ExportButton } from "./export-button";
import { DeletePiggybankDialog } from "./delete-piggybank-dialog";

export default async function SettingsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: pb } = await supabase
    .from("piggybank")
    .select(
      "id, kid_profile_id, kid_profile(display_name, age, avatar_emoji), distribution_rule(spend_bps, save_bps, share_bps)",
    )
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (!pb) redirect("/onboarding/step-1");

  const kidRaw = pb.kid_profile;
  const kid =
    (Array.isArray(kidRaw) ? kidRaw[0] : kidRaw) as
      | { display_name?: string; age?: number; avatar_emoji?: string }
      | null;
  const ruleRaw = pb.distribution_rule;
  const rule =
    ((Array.isArray(ruleRaw) ? ruleRaw[0] : ruleRaw) as
      | { spend_bps: number; save_bps: number; share_bps: number }
      | null) ?? { spend_bps: 6000, save_bps: 2000, share_bps: 2000 };

  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-8">
        <header>
          <h1 className="font-display text-3xl">Settings</h1>
          <p className="text-sm text-ink-muted mt-1">
            Account, kid profile, distribution rule, export, delete.
          </p>
        </header>

        <Section title="Kid profile" subtitle="Name, age, and avatar.">
          <KidProfileForm
            initialName={kid?.display_name ?? "Kid"}
            initialAge={kid?.age ?? 8}
            initialEmoji={kid?.avatar_emoji ?? "🐷"}
          />
        </Section>

        <Section
          title="Distribution rule"
          subtitle="Default split for new deposits. Per-deposit override available on Add Money."
        >
          <DistributionForm
            initialSpendPct={Math.round(rule.spend_bps / 100)}
            initialSavePct={Math.round(rule.save_bps / 100)}
            initialSharePct={Math.round(rule.share_bps / 100)}
          />
        </Section>

        <Section title="Account" subtitle={user.email ?? ""}>
          <div className="space-y-3">
            <LogoutButton />
          </div>
        </Section>

        <Section title="Change password" subtitle="Rotates immediately.">
          <PasswordForm />
        </Section>

        <Section
          title="Your data"
          subtitle="Download a JSON snapshot of everything: transactions, funders, subs, the lot."
        >
          <ExportButton />
        </Section>

        <Section
          title="Danger zone"
          subtitle="Delete the piggybank. Soft-delete with 30-day recovery."
        >
          <DeletePiggybankDialog />
        </Section>
      </div>
    </AppShell>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-card border border-line-soft p-6 space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {subtitle ? <p className="text-sm text-ink-muted">{subtitle}</p> : null}
      </div>
      <div>{children}</div>
    </section>
  );
}
