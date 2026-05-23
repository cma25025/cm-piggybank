import { describe, it, expect, afterAll } from "vitest";
import { createTestPiggybank, type TestPiggybank } from "../helpers/test-caretaker";
import { hasIntegrationEnv } from "../helpers/admin";

describe.skipIf(!hasIntegrationEnv())("balance invariants under random ops", () => {
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

  it("bucket.balance_cents = sum(child txns) after every mutation in a 30-step random sequence", async () => {
    const pb = await createTestPiggybank();
    created.push(pb);

    // Seed with $100 so spends have room.
    await pb.client.rpc("add_deposit", {
      p_piggybank_id: pb.piggybankId,
      p_amount_cents: 10_000,
      p_funder_name: "Seed",
      p_source_type: "allowance",
    });

    const bucketIds = [pb.spendBucketId, pb.saveBucketId, pb.shareBucketId];
    const txnIds: string[] = [];

    for (let step = 0; step < 30; step++) {
      const op = pickOp(step);
      if (op === "deposit") {
        const amount = randCents(100, 2000);
        await pb.client.rpc("add_deposit", {
          p_piggybank_id: pb.piggybankId,
          p_amount_cents: amount,
          p_funder_name: `Funder ${step % 3}`,
          p_source_type: "other",
        });
      } else if (op === "spend") {
        const bucketId = pick(bucketIds);
        const { data: bal } = await pb.client
          .from("bucket")
          .select("balance_cents")
          .eq("id", bucketId)
          .maybeSingle();
        const avail = Number(bal?.balance_cents ?? 0);
        if (avail < 50) continue; // skip if not enough
        const amount = Math.min(avail, randCents(50, 500));
        const { data: spendId, error } = await pb.client.rpc("log_spend", {
          p_bucket_id: bucketId,
          p_subcategory_id: null,
          p_amount_cents: amount,
          p_note: null,
          p_occurred_at: null,
        });
        if (error) {
          // Insufficient (rounding) — skip
          continue;
        }
        if (spendId) txnIds.push(spendId as string);
      } else if (op === "void" && txnIds.length > 0) {
        const idx = Math.floor(Math.random() * txnIds.length);
        const txnId = txnIds[idx];
        const { error } = await pb.client.rpc("void_transaction", {
          p_transaction_id: txnId,
          p_reason: "test",
        });
        if (!error) {
          // remove from voidable set
          txnIds.splice(idx, 1);
        }
      }

      // INVARIANT: each bucket's balance_cents = sum of signed amounts of
      // ALL transactions in that bucket. The balance trigger fires on every
      // INSERT/UPDATE/DELETE and does NOT know about voided_at — when a
      // void writes a reversing adjustment, the original stays (with
      // voided_at set) and the adjustment subtracts/adds the opposite.
      // The bucket.balance reflects both. So our expected sum must include
      // voided rows too (they cancel out with their reversals naturally).
      for (const bucketId of bucketIds) {
        const { data: bucket } = await pb.client
          .from("bucket")
          .select("balance_cents")
          .eq("id", bucketId)
          .maybeSingle();
        const { data: txns } = await pb.client
          .from("transaction")
          .select("kind, amount_cents")
          .eq("bucket_id", bucketId);

        const expected = (txns ?? []).reduce((acc, t) => {
          const sign = t.kind === "spend" ? -1 : 1;
          return acc + sign * (t.amount_cents ?? 0);
        }, 0);
        expect(
          Number(bucket?.balance_cents ?? 0),
          `step=${step} op=${op} bucket=${bucketId}`,
        ).toBe(expected);
      }
    }
  }, 60_000);
});

function pickOp(step: number): "deposit" | "spend" | "void" {
  // First few steps lean deposit so we have funds to spend / void.
  if (step < 3) return "deposit";
  const roll = Math.random();
  if (roll < 0.4) return "deposit";
  if (roll < 0.85) return "spend";
  return "void";
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randCents(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}
