import { describe, it, expect } from "vitest";
import { computeStaleness } from "./staleness";

const NOON_UTC = (y: number, m: number, d: number) =>
  new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

describe("computeStaleness", () => {
  it("returns isStale + null daysSince for never-reconciled", () => {
    const out = computeStaleness({ lastReconcileAt: null });
    expect(out).toEqual({ lastReconcileAt: null, daysSince: null, isStale: true });
  });

  it("counts whole UTC calendar days between two noons", () => {
    const now = NOON_UTC(2026, 5, 18);
    const out = computeStaleness({
      lastReconcileAt: NOON_UTC(2026, 5, 11).toISOString(),
      now,
    });
    expect(out.daysSince).toBe(7);
    expect(out.isStale).toBe(true);
  });

  it("treats an evening reconcile + next-morning check as 1 day, not 0", () => {
    // 22:00 UTC on day N → 09:00 UTC on day N+1 = 11 hours elapsed in wall-clock.
    // Old wall-clock subtraction reported floor(11h/24h) = 0 days.
    // Calendar-day diff reports 1.
    const last = new Date(Date.UTC(2026, 4, 17, 22, 0, 0));
    const now = new Date(Date.UTC(2026, 4, 18, 9, 0, 0));
    const out = computeStaleness({ lastReconcileAt: last.toISOString(), now });
    expect(out.daysSince).toBe(1);
    expect(out.isStale).toBe(false);
  });

  it("is not stale at exactly 6 days", () => {
    const now = NOON_UTC(2026, 5, 18);
    const out = computeStaleness({
      lastReconcileAt: NOON_UTC(2026, 5, 12).toISOString(),
      now,
    });
    expect(out.daysSince).toBe(6);
    expect(out.isStale).toBe(false);
  });

  it("is stale at exactly 7 days", () => {
    const now = NOON_UTC(2026, 5, 18);
    const out = computeStaleness({
      lastReconcileAt: NOON_UTC(2026, 5, 11).toISOString(),
      now,
    });
    expect(out.daysSince).toBe(7);
    expect(out.isStale).toBe(true);
  });

  it("clamps future-dated reconciliations to 0 days (defensive)", () => {
    const now = NOON_UTC(2026, 5, 18);
    const out = computeStaleness({
      lastReconcileAt: NOON_UTC(2026, 5, 25).toISOString(),
      now,
    });
    expect(out.daysSince).toBe(0);
    expect(out.isStale).toBe(false);
  });

  it("returns daysSince 0 for same-day reconcile", () => {
    const now = new Date(Date.UTC(2026, 4, 18, 23, 0, 0));
    const last = new Date(Date.UTC(2026, 4, 18, 1, 0, 0));
    const out = computeStaleness({ lastReconcileAt: last.toISOString(), now });
    expect(out.daysSince).toBe(0);
    expect(out.isStale).toBe(false);
  });
});
