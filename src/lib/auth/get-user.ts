import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Server-only helper: returns the authenticated user, or redirects to /login.
 * Use in server components and server actions for protected routes.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/** Returns the current user or null. Does not redirect. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
