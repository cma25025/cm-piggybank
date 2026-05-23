import { describe, it, expect, afterAll } from "vitest";
import { createTestPiggybank, type TestPiggybank } from "../helpers/test-caretaker";
import { hasIntegrationEnv } from "../helpers/admin";

describe.skipIf(!hasIntegrationEnv())("RLS isolation", () => {
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

  it("caretaker B cannot SELECT caretaker A's piggybank", async () => {
    const a = await createTestPiggybank({ kidName: "Alice Kid" });
    const b = await createTestPiggybank({ kidName: "Bob Kid" });
    created.push(a, b);

    // B should see exactly 1 piggybank (their own), not A's.
    const { data } = await b.client.from("piggybank").select("id, display_name");
    expect(data).toBeDefined();
    expect(data!.length).toBe(1);
    expect(data![0].id).toBe(b.piggybankId);
    expect(data![0].id).not.toBe(a.piggybankId);
  });

  it("caretaker B cannot SELECT caretaker A's buckets / subs / funders / transactions", async () => {
    const a = await createTestPiggybank({ kidName: "Alice2" });
    const b = await createTestPiggybank({ kidName: "Bob2" });
    created.push(a, b);

    // A creates a deposit so there's data to leak.
    await a.client.rpc("add_deposit", {
      p_piggybank_id: a.piggybankId,
      p_amount_cents: 5000,
      p_funder_name: "Alice's Funder",
      p_source_type: "allowance",
    });

    // B's SELECTs by A's ids should return empty (RLS) — not error.
    const { data: aBuckets } = await b.client
      .from("bucket")
      .select("id")
      .eq("piggybank_id", a.piggybankId);
    expect(aBuckets).toEqual([]);

    const { data: aSubs } = await b.client
      .from("subcategory")
      .select("id")
      .eq("piggybank_id", a.piggybankId);
    expect(aSubs).toEqual([]);

    const { data: aFunders } = await b.client
      .from("funder")
      .select("id")
      .eq("piggybank_id", a.piggybankId);
    expect(aFunders).toEqual([]);

    const { data: aTxns } = await b.client
      .from("transaction")
      .select("id")
      .eq("piggybank_id", a.piggybankId);
    expect(aTxns).toEqual([]);
  });

  it("soft-deleted piggybank is hidden even from its own caretaker (SELECT policy)", async () => {
    const a = await createTestPiggybank({ kidName: "ToDelete" });
    created.push(a);

    // Confirm visible first.
    const { data: before } = await a.client.from("piggybank").select("id");
    expect(before!.length).toBe(1);

    // Soft-delete via the RPC.
    const { error: deleteError } = await a.client.rpc("soft_delete_piggybank", {
      p_piggybank_id: a.piggybankId,
    });
    expect(deleteError).toBeNull();

    // SELECT policy filters deleted_at IS NULL.
    const { data: after } = await a.client.from("piggybank").select("id");
    expect(after).toEqual([]);
  });

  it("caretaker B cannot soft-delete caretaker A's piggybank via RPC", async () => {
    const a = await createTestPiggybank({ kidName: "Victim" });
    const b = await createTestPiggybank({ kidName: "Attacker" });
    created.push(a, b);

    // B calls soft_delete with A's piggybank id. RPC runs under B's JWT so
    // the UPDATE's RLS check rejects.
    const { error } = await b.client.rpc("soft_delete_piggybank", {
      p_piggybank_id: a.piggybankId,
    });
    // Either error (raised "not found") OR success with no effect — either
    // way A's piggybank stays alive.
    void error;

    // A re-checks: their piggybank is still visible and not deleted.
    const { data: aStill } = await a.client
      .from("piggybank")
      .select("id, deleted_at")
      .eq("id", a.piggybankId);
    expect(aStill).toBeDefined();
    expect(aStill!.length).toBe(1);
    expect(aStill![0].deleted_at).toBeNull();
  });
});
