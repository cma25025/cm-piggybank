import { describe, it, expect } from "vitest";
import {
  sundayOfWeek,
  weekBounds,
  parseWeekKey,
  previousWeekKey,
  nextWeekKey,
  formatWeekLabel,
  currentWeekKey,
} from "./week";

describe("week math", () => {
  describe("sundayOfWeek", () => {
    it("returns the same date when input is already Sunday", () => {
      // 2026-05-17 was a Sunday
      const sun = new Date(Date.UTC(2026, 4, 17, 12, 0, 0));
      expect(sundayOfWeek(sun).toISOString()).toBe("2026-05-17T00:00:00.000Z");
    });

    it("returns Sunday for any day in that week", () => {
      // Wed 2026-05-20 → prior Sunday is 2026-05-17
      const wed = new Date(Date.UTC(2026, 4, 20, 15, 0, 0));
      expect(sundayOfWeek(wed).toISOString()).toBe("2026-05-17T00:00:00.000Z");
      // Sat 2026-05-23 → same week's Sunday is 2026-05-17
      const sat = new Date(Date.UTC(2026, 4, 23, 23, 59, 0));
      expect(sundayOfWeek(sat).toISOString()).toBe("2026-05-17T00:00:00.000Z");
    });

    it("rolls back across month boundary", () => {
      // 2026-06-02 (Tue) → prior Sunday is 2026-05-31
      const tue = new Date(Date.UTC(2026, 5, 2, 0, 0, 0));
      expect(sundayOfWeek(tue).toISOString()).toBe("2026-05-31T00:00:00.000Z");
    });
  });

  describe("weekBounds", () => {
    it("end is exactly 7 days after start", () => {
      const b = weekBounds(new Date(Date.UTC(2026, 4, 20)));
      expect(b.end.getTime() - b.start.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it("key matches start date", () => {
      const b = weekBounds(new Date(Date.UTC(2026, 4, 20)));
      expect(b.key).toBe("2026-05-17");
    });
  });

  describe("parseWeekKey", () => {
    it("accepts a valid Sunday key", () => {
      const b = parseWeekKey("2026-05-17");
      expect(b).not.toBeNull();
      expect(b!.start.toISOString()).toBe("2026-05-17T00:00:00.000Z");
    });

    it("rejects a non-Sunday key", () => {
      // 2026-05-18 is Monday, not Sunday — URL is malformed
      expect(parseWeekKey("2026-05-18")).toBeNull();
    });

    it("rejects malformed strings", () => {
      expect(parseWeekKey("not-a-date")).toBeNull();
      expect(parseWeekKey("2026-5-17")).toBeNull(); // unpadded
      expect(parseWeekKey("20260517")).toBeNull();
    });
  });

  describe("previousWeekKey / nextWeekKey", () => {
    it("round-trips through both directions", () => {
      expect(previousWeekKey("2026-05-17")).toBe("2026-05-10");
      expect(nextWeekKey("2026-05-17")).toBe("2026-05-24");
      expect(nextWeekKey(previousWeekKey("2026-05-17")!)).toBe("2026-05-17");
    });

    it("returns null for invalid input", () => {
      expect(previousWeekKey("garbage")).toBeNull();
      expect(nextWeekKey("2026-05-18")).toBeNull(); // not a Sunday
    });
  });

  describe("formatWeekLabel", () => {
    it("renders single-month range", () => {
      const b = weekBounds(new Date(Date.UTC(2026, 4, 17)));
      expect(formatWeekLabel(b)).toBe("May 17 – May 23");
    });

    it("renders cross-month range", () => {
      // 2026-05-31 (Sun) through 2026-06-06 (Sat)
      const b = weekBounds(new Date(Date.UTC(2026, 4, 31)));
      expect(formatWeekLabel(b)).toBe("May 31 – Jun 6");
    });
  });

  describe("currentWeekKey", () => {
    it("returns YYYY-MM-DD format", () => {
      const key = currentWeekKey(new Date(Date.UTC(2026, 4, 20)));
      expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(key).toBe("2026-05-17");
    });
  });
});
