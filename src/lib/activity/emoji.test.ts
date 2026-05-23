import { describe, it, expect } from "vitest";
import { pickActivityEmoji } from "./emoji";

describe("pickActivityEmoji", () => {
  it("returns the subcategory emoji when present (highest precedence)", () => {
    expect(
      pickActivityEmoji({ kind: "spend", subEmoji: "🎮", sourceType: null, note: null }),
    ).toBe("🎮");
    // Even for adjustments + reconciled note, sub emoji wins (caretaker-chosen).
    expect(
      pickActivityEmoji({
        kind: "adjustment",
        subEmoji: "🎮",
        sourceType: null,
        note: "Reconciled: rounding",
      }),
    ).toBe("🎮");
  });

  it("routes reconciliation adjustments to the scales emoji", () => {
    expect(
      pickActivityEmoji({
        kind: "adjustment",
        subEmoji: null,
        sourceType: null,
        note: "Reconciled: rounding",
      }),
    ).toBe("⚖️");
    expect(
      pickActivityEmoji({
        kind: "adjustment",
        subEmoji: null,
        sourceType: null,
        note: "reconciled: rounding", // case-insensitive
      }),
    ).toBe("⚖️");
  });

  it("falls back to wrench for non-reconciliation adjustments", () => {
    expect(
      pickActivityEmoji({
        kind: "adjustment",
        subEmoji: null,
        sourceType: null,
        note: "Manual fix",
      }),
    ).toBe("🔧");
    expect(
      pickActivityEmoji({
        kind: "adjustment",
        subEmoji: null,
        sourceType: null,
        note: null,
      }),
    ).toBe("🔧");
  });

  it("maps deposit source types to their emoji", () => {
    expect(
      pickActivityEmoji({ kind: "deposit", subEmoji: null, sourceType: "birthday", note: null }),
    ).toBe("🎁");
    expect(
      pickActivityEmoji({ kind: "deposit", subEmoji: null, sourceType: "chores", note: null }),
    ).toBe("🧹");
    expect(
      pickActivityEmoji({ kind: "deposit", subEmoji: null, sourceType: null, note: null }),
    ).toBe("💵");
    expect(
      pickActivityEmoji({ kind: "deposit", subEmoji: null, sourceType: "unknown", note: null }),
    ).toBe("💵");
  });

  it("returns kind defaults for spend / interest / opening_balance", () => {
    expect(
      pickActivityEmoji({ kind: "spend", subEmoji: null, sourceType: null, note: null }),
    ).toBe("🛒");
    expect(
      pickActivityEmoji({ kind: "interest", subEmoji: null, sourceType: null, note: null }),
    ).toBe("📈");
    expect(
      pickActivityEmoji({
        kind: "opening_balance",
        subEmoji: null,
        sourceType: null,
        note: null,
      }),
    ).toBe("🏦");
  });

  it("returns the middot for unknown kinds", () => {
    expect(
      pickActivityEmoji({ kind: "transfer", subEmoji: null, sourceType: null, note: null }),
    ).toBe("·");
  });
});
