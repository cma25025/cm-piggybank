import { describe, it, expect } from "vitest";
import { computeDistribution, type DistributionRule } from "./distribution";

const DEFAULT_RULE: DistributionRule = { spend_bps: 6000, save_bps: 2000, share_bps: 2000 };

describe("computeDistribution", () => {
  describe("happy paths", () => {
    it("splits $50 at 60/20/20 cleanly", () => {
      expect(computeDistribution(5000, DEFAULT_RULE)).toEqual({
        spend_cents: 3000,
        save_cents: 1000,
        share_cents: 1000,
      });
    });

    it("splits $1 (100 cents) at 60/20/20 cleanly (no rounding needed)", () => {
      expect(computeDistribution(100, DEFAULT_RULE)).toEqual({
        spend_cents: 60,
        save_cents: 20,
        share_cents: 20,
      });
    });

    it("splits $1000 at 50/40/10", () => {
      expect(
        computeDistribution(100_000, { spend_bps: 5000, save_bps: 4000, share_bps: 1000 }),
      ).toEqual({
        spend_cents: 50_000,
        save_cents: 40_000,
        share_cents: 10_000,
      });
    });
  });

  describe("rounding — Share gets the remainder (pro-charity)", () => {
    it("splits $33.33 (3333 cents) at 60/20/20 — Share absorbs the 2-cent remainder", () => {
      // 3333 * 6000 / 10000 = 1999.8 → floor = 1999
      // 3333 * 2000 / 10000 = 666.6 → floor = 666
      // share = 3333 - 1999 - 666 = 668 (+2¢ over a clean 666)
      const result = computeDistribution(3333, DEFAULT_RULE);
      expect(result).toEqual({ spend_cents: 1999, save_cents: 666, share_cents: 668 });
      expect(result.spend_cents + result.save_cents + result.share_cents).toBe(3333);
    });

    it("splits 1 cent at 60/20/20 — entire amount lands in Share", () => {
      // 1 * 6000 / 10000 = 0.6 → floor = 0
      // 1 * 2000 / 10000 = 0.2 → floor = 0
      // share = 1 - 0 - 0 = 1
      expect(computeDistribution(1, DEFAULT_RULE)).toEqual({
        spend_cents: 0,
        save_cents: 0,
        share_cents: 1,
      });
    });

    it("preserves the sum invariant across 1000 random amounts × random rules", () => {
      for (let i = 0; i < 1000; i++) {
        const amount = Math.floor(Math.random() * 1_000_000) + 1; // [1, 1_000_000]
        // Random rule that sums to 10000
        const spend_bps = Math.floor(Math.random() * 9000) + 500;
        const save_bps = Math.floor(Math.random() * (10000 - spend_bps - 100)) + 50;
        const share_bps = 10000 - spend_bps - save_bps;
        const rule: DistributionRule = { spend_bps, save_bps, share_bps };
        const result = computeDistribution(amount, rule);
        expect(result.spend_cents + result.save_cents + result.share_cents).toBe(amount);
        expect(result.spend_cents).toBeGreaterThanOrEqual(0);
        expect(result.save_cents).toBeGreaterThanOrEqual(0);
        expect(result.share_cents).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("input validation", () => {
    it("rejects zero amount", () => {
      expect(() => computeDistribution(0, DEFAULT_RULE)).toThrow(/must be > 0/);
    });

    it("rejects negative amount", () => {
      expect(() => computeDistribution(-100, DEFAULT_RULE)).toThrow(/must be > 0/);
    });

    it("rejects non-integer amount", () => {
      expect(() => computeDistribution(100.5, DEFAULT_RULE)).toThrow(/finite integer/);
    });

    it("rejects Infinity", () => {
      expect(() => computeDistribution(Infinity, DEFAULT_RULE)).toThrow(/finite integer/);
    });

    it("rejects NaN", () => {
      expect(() => computeDistribution(NaN, DEFAULT_RULE)).toThrow(/finite integer/);
    });

    it("rejects bps that don't sum to 10000", () => {
      expect(() =>
        computeDistribution(100, { spend_bps: 5000, save_bps: 3000, share_bps: 1000 }),
      ).toThrow(/must sum to 10000/);
    });

    it("rejects negative bps (even if total sums correctly)", () => {
      expect(() =>
        computeDistribution(100, { spend_bps: -100, save_bps: 5000, share_bps: 5100 }),
      ).toThrow(/non-negative integers/);
    });

    it("rejects non-integer bps", () => {
      expect(() =>
        computeDistribution(100, { spend_bps: 6000.5, save_bps: 1999.5, share_bps: 2000 }),
      ).toThrow(/non-negative integers/);
    });
  });

  describe("share-takes-remainder is intentional", () => {
    it("always gives Share an amount >= the clean share_bps share", () => {
      // For ANY input, Share should get at least floor(amount * share_bps / 10000),
      // and at most floor(amount * share_bps / 10000) + 2 (max possible carry from
      // two floor operations).
      for (let amount = 1; amount <= 100; amount++) {
        const result = computeDistribution(amount, DEFAULT_RULE);
        const cleanShare = Math.floor((amount * 2000) / 10000);
        expect(result.share_cents).toBeGreaterThanOrEqual(cleanShare);
        expect(result.share_cents).toBeLessThanOrEqual(cleanShare + 2);
      }
    });
  });
});
