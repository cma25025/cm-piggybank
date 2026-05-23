import { describe, it, expect } from "vitest";
import { ReconcileSchema } from "./schemas";

describe("ReconcileSchema", () => {
  it("accepts a valid reconciliation submission", () => {
    const parsed = ReconcileSchema.safeParse({
      actual_dollars: "42.50",
      reason: "rounding",
      note: "off by a quarter",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.actual_dollars).toBe(42.5);
      expect(parsed.data.reason).toBe("rounding");
      expect(parsed.data.note).toBe("off by a quarter");
    }
  });

  it("accepts a zero-dollar count (jar matched the app)", () => {
    const parsed = ReconcileSchema.safeParse({
      actual_dollars: "0",
      reason: "rounding",
      note: null,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects negative dollar counts", () => {
    const parsed = ReconcileSchema.safeParse({
      actual_dollars: "-10",
      reason: "rounding",
      note: null,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects unknown reasons", () => {
    const parsed = ReconcileSchema.safeParse({
      actual_dollars: "10",
      reason: "made-up-reason",
      note: null,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects notes over 200 chars", () => {
    const parsed = ReconcileSchema.safeParse({
      actual_dollars: "10",
      reason: "other",
      note: "x".repeat(201),
    });
    expect(parsed.success).toBe(false);
  });

  it("trims whitespace from notes and allows null", () => {
    const parsed = ReconcileSchema.safeParse({
      actual_dollars: "10",
      reason: "other",
      note: "  trimmed  ",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.note).toBe("trimmed");

    const nullCase = ReconcileSchema.safeParse({
      actual_dollars: "10",
      reason: "other",
      note: null,
    });
    expect(nullCase.success).toBe(true);
  });

  it("accepts all five reason enum values", () => {
    for (const reason of ["rounding", "cash_missing", "found_cash", "miscount", "other"]) {
      const parsed = ReconcileSchema.safeParse({
        actual_dollars: "10",
        reason,
        note: null,
      });
      expect(parsed.success).toBe(true);
    }
  });
});
