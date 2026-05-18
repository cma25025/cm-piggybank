import { requireUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";

/** App shell wrapping sidebar + content. Server component fetches kid info. */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: piggybank } = await supabase
    .from("piggybank")
    .select("kid_profile(display_name, avatar_emoji)")
    .limit(1)
    .maybeSingle();

  const kid = (piggybank?.kid_profile as { display_name?: string; avatar_emoji?: string } | null) ?? null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        kidName={kid?.display_name ?? null}
        kidAvatarEmoji={kid?.avatar_emoji ?? null}
        caretakerEmail={user.email ?? null}
      />
      <main className="flex-1 min-w-0 pb-16 md:pb-0">{children}</main>
      <MobileNav />
    </div>
  );
}
