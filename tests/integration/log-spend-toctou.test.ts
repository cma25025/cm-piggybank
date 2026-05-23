import { describe, it, expect, afterAll } from "vitest";
import { createTestPiggybank, type TestPiggybank } from "../helpers/test-caretaker";
import { hasIntegrationEnv } from "../helpers/admin";

describe.skipIf(!hasIntegrationEnv())("log_spend TOCTOU concurrency", () => {
  const created: TestPiggybank[] = [];

  afterAll(async () => {
    for (const c of created) {
      try {
        await c.cleanup();
      } catch (e) {
        console.warn("cleanup failed for", c.email, e);
      }
    }
  });

  it("two concurrent spends covering exactly one: one succeeds, one fails cleanly", async () => {
    const pb = await createTestPiggybank();
    created.push(pb);

    // Deposit $50, distributes 60/20/20 → Spend bucket gets $30.
    await pb.client.rpc("add_deposit", {
      p_piggybank_id: pb.piggybankId,
      p_amount_cents: 5000,
      p_funder_name: "Seed",
      p_source_type: "allowance",
    });

    // Verify Spend bucket has $30.
    const { data: spendBucket } = await pb.client
      .from("bucket")
      .select("balance_cents")
      .eq("id", pb.spendBucketId)
      .maybeSingle();
    expect(Number(spendBucket?.balance_cents)).toBe(3000);

    // Fire two concurrent $30 spends. The bucket's FOR UPDATE lock should
    // serialize them — one succeeds, one fails with insufficient balance.
    const [result1, result2] = await Promise.all([
      pb.client.rpc("log_spend", {
        p_bucket_id: pb.spendBucketId,
        p_subcategory_id: null,
        p_amount_cents: 3000,
        p_note: "concurrent A",
        p_occurred_at: null,
      }),
      pb.client.rpc("log_spend", {
        p_bucket_id: pb.spendBucketId,
        p_subcategory_id: null,
        p_amount_cents: 3000,
        p_note: "concurrent B",
        p_occurred_at: null,
      }),
    ]);

    const errors = [result1.error, result2.error].filter(Boolean);
    const successes = [result1.data, result2.data].filter(Boolean);

    expect(successes.length).toBe(1);
    expect(errors.length).toBe(1);
    expect(errors[0]!.message).toMatch(/insufficient balance/i);

    // Final bucket balance is $0, not -$30 (oversubtract would mean
    // both succeeded and balance went negative).
    const { data: after } = await pb.client
      .from("bucket")
      .select("balance_cents")
      .eq("id", pb.spendBucketId)
      .maybeSingle();
    expect(Number(after?.balance_cents)).toBe(0);
  });
});
