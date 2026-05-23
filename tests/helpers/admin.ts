import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Admin (service role) Supabase client. Bypasses RLS — use ONLY for test
 * setup / teardown (creating + deleting test caretakers). Never call this
 * from production code.
 */
export function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error(
      "adminClient: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from .env.local",
    );
  }
  return createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * True iff .env.local has the keys integration tests need. Evaluated at
 * CALL time (not module-import time) so the vitest setupFile gets a
 * chance to populate process.env before describe.skipIf runs.
 */
export function hasIntegrationEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
