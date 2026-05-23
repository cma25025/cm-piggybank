import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { adminClient } from "./admin";

export interface TestCaretaker {
  userId: string;
  email: string;
  password: string;
  /** Auth-aware Supabase client signed in as this caretaker. RLS applies. */
  client: SupabaseClient;
  /** Hard-deletes the caretaker (cascades to all their data via FKs). */
  cleanup: () => Promise<void>;
}

/**
 * Create a throwaway caretaker for one test. Returns a signed-in Supabase
 * client (RLS-aware) plus a cleanup() that drops the user. The user delete
 * cascades to kid_profile (caretaker_user_id FK on cascade) which cascades
 * to piggybank → bucket / subcategory / funder / transaction / request.
 */
export async function createTestCaretaker(): Promise<TestCaretaker> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const admin = adminClient();

  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `test-${id}@piggybank-test.example`;
  const password = `TestPwd-${Math.random().toString(36).slice(2, 12)}!Abc`;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    throw new Error(`createTestCaretaker: ${createError?.message ?? "no user returned"}`);
  }

  const client = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    await admin.auth.admin.deleteUser(created.user.id);
    throw new Error(`createTestCaretaker signIn: ${signInError.message}`);
  }

  return {
    userId: created.user.id,
    email,
    password,
    client,
    cleanup: async () => {
      await admin.auth.admin.deleteUser(created.user.id);
    },
  };
}

export interface TestPiggybank extends TestCaretaker {
  piggybankId: string;
  spendBucketId: string;
  saveBucketId: string;
  shareBucketId: string;
}

/**
 * Caretaker + onboarded piggybank (kid "Test Kid", age 8, 60/20/20 default).
 * Returns the piggybank id + bucket ids by kind for easy use in tests.
 */
export async function createTestPiggybank(opts?: {
  kidName?: string;
  age?: number;
}): Promise<TestPiggybank> {
  const caretaker = await createTestCaretaker();
  const { data: piggybankId, error } = await caretaker.client.rpc(
    "create_piggybank_with_defaults",
    {
      p_kid_name: opts?.kidName ?? "Test Kid",
      p_age: opts?.age ?? 8,
      p_avatar_emoji: "🐷",
    },
  );
  if (error || !piggybankId) {
    await caretaker.cleanup();
    throw new Error(`createTestPiggybank RPC: ${error?.message ?? "no id"}`);
  }

  const { data: buckets, error: bucketsError } = await caretaker.client
    .from("bucket")
    .select("id, kind")
    .eq("piggybank_id", piggybankId);
  if (bucketsError || !buckets || buckets.length !== 3) {
    await caretaker.cleanup();
    throw new Error(`createTestPiggybank buckets: ${bucketsError?.message ?? "wrong count"}`);
  }

  const byKind = Object.fromEntries(
    buckets.map((b) => [b.kind as string, b.id as string]),
  );

  return {
    ...caretaker,
    piggybankId: piggybankId as string,
    spendBucketId: byKind.spend,
    saveBucketId: byKind.save,
    shareBucketId: byKind.share,
  };
}
