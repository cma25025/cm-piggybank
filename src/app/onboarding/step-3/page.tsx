import Link from "next/link";
import { requireUser } from "@/lib/auth/get-user";
import { getOnboardingState } from "@/lib/onboarding/state";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StepShell } from "@/components/onboarding/step-shell";
import { Button } from "@/components/ui/button";
import { AddFunderForm } from "./add-funder-form";

export default async function Step3Page() {
  const user = await requireUser();
  const state = await getOnboardingState(user.id);
  if (!state.piggybankId) redirect("/onboarding/step-1");

  const supabase = await createClient();
  const { data: funders } = await supabase
    .from("funder")
    .select("id, display_name, relationship")
    .eq("piggybank_id", state.piggybankId)
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  return (
    <StepShell
      step={3}
      title="Who else might add money?"
      subtitle="Tag deposits by funder so you can see who's contributed. Grandma, aunts, anyone."
    >
      <div className="space-y-5">
        <ul className="space-y-2">
          {(funders ?? []).map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-xl border border-line-soft bg-line-soft/40 p-3"
            >
              <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-display text-lg">
                {(f.display_name?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-medium">{f.display_name}</div>
                {f.relationship ? (
                  <div className="text-xs text-ink-muted">{f.relationship}</div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        <AddFunderForm />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" asChild className="flex-1">
            <Link href="/onboarding/step-2">Back</Link>
          </Button>
          <Button asChild className="flex-[2]">
            <Link href="/onboarding/step-4">Continue</Link>
          </Button>
        </div>
      </div>
    </StepShell>
  );
}
