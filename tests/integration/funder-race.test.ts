import { describe, it, expect, afterAll } from "vitest";
import { createTestPiggybank, type TestPiggybank } from "../helpers/test-caretaker";
import { hasIntegrationEnv } from "../helpers/admin";

describe.skipIf(!hasIntegrationEnv())("find_or_create_funder race", () => {
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

  it("concurrent case-variant inserts produce one row", async () => {
    const pb = await createTestPiggybank();
    created.push(pb);

    // Five concurrent inserts: same name, different case + whitespace variants.
    const variants = ["Grandma", "grandma", "GRANDMA", "Grandma ", " grandma"];
    const results = await Promise.all(
      variants.map((name) =>
        pb.client.rpc("find_or_create_funder", {
          p_piggybank_id: pb.piggybankId,
          p_display_name: name,
          p_relationship: null,
        }),
      ),
    );

    // All calls return successfully with the SAME funder id.
    const ids = results.map((r) => {
      expect(r.error).toBeNull();
      return r.data;
    });
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size, "all variants should resolve to one funder id").toBe(1);

    // DB: exactly one non-archived row with this case-insensitive name.
    const { data: funders } = await pb.client
      .from("funder")
      .select("id, display_name")
      .eq("piggybank_id", pb.piggybankId)
      .ilike("display_name", "grandma");
    expect(funders!.length).toBe(1);

    // The retained value should be one of the inputs — RPC trims whitespace
    // (per Phase 6.5 fix). " grandma" stored would be "grandma" after trim.
    expect(funders![0].display_name.trim()).toBe(funders![0].display_name);
  });

  it("backfills relationship on existing-funder re-add when prior was NULL", async () => {
    const pb = await createTestPiggybank();
    created.push(pb);

    // First add with no relationship.
    const { data: firstId } = await pb.client.rpc("find_or_create_funder", {
      p_piggybank_id: pb.piggybankId,
      p_display_name: "Aunt",
      p_relationship: null,
    });

    // Second add with relationship — should backfill.
    const { data: secondId } = await pb.client.rpc("find_or_create_funder", {
      p_piggybank_id: pb.piggybankId,
      p_display_name: "Aunt",
      p_relationship: "mom's sister",
    });

    expect(secondId).toBe(firstId);

    const { data: funder } = await pb.client
      .from("funder")
      .select("relationship")
      .eq("id", firstId as string)
      .maybeSingle();
    expect(funder?.relationship).toBe("mom's sister");

    // Third add with DIFFERENT relationship — should NOT overwrite the existing one.
    await pb.client.rpc("find_or_create_funder", {
      p_piggybank_id: pb.piggybankId,
      p_display_name: "Aunt",
      p_relationship: "moms sister but typoed",
    });

    const { data: funderAfter } = await pb.client
      .from("funder")
      .select("relationship")
      .eq("id", firstId as string)
      .maybeSingle();
    expect(funderAfter?.relationship).toBe("mom's sister");
  });
});
