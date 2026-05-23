import { describe, it, expect } from "vitest";
import {
  AddFunderSchema,
  ArchiveFunderSchema,
  EditFunderSchema,
} from "./schemas";

// v4-shaped UUID: zod's .uuid() validates the version + variant bits in v4.
const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("funder schemas", () => {
  describe("AddFunderSchema", () => {
    it("accepts a valid name and relationship", () => {
      const parsed = AddFunderSchema.safeParse({
        display_name: "Grandma",
        relationship: "mom's mom",
      });
      expect(parsed.success).toBe(true);
    });

    it("trims whitespace and rejects empty names", () => {
      const parsed = AddFunderSchema.safeParse({
        display_name: "   ",
        relationship: null,
      });
      expect(parsed.success).toBe(false);
    });

    it("rejects names over 80 chars", () => {
      const parsed = AddFunderSchema.safeParse({
        display_name: "x".repeat(81),
        relationship: null,
      });
      expect(parsed.success).toBe(false);
    });

    it("allows null relationship", () => {
      const parsed = AddFunderSchema.safeParse({
        display_name: "Aunt",
        relationship: null,
      });
      expect(parsed.success).toBe(true);
    });

    it("rejects relationships over 40 chars", () => {
      const parsed = AddFunderSchema.safeParse({
        display_name: "Aunt",
        relationship: "x".repeat(41),
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("EditFunderSchema", () => {
    it("requires a UUID funder_id", () => {
      const bad = EditFunderSchema.safeParse({
        funder_id: "not-a-uuid",
        display_name: "Grandma",
        relationship: null,
      });
      expect(bad.success).toBe(false);

      const good = EditFunderSchema.safeParse({
        funder_id: VALID_UUID,
        display_name: "Grandma",
        relationship: null,
      });
      expect(good.success).toBe(true);
    });
  });

  describe("ArchiveFunderSchema", () => {
    it("rejects non-UUID ids", () => {
      expect(ArchiveFunderSchema.safeParse({ funder_id: "bogus" }).success).toBe(false);
      expect(ArchiveFunderSchema.safeParse({ funder_id: VALID_UUID }).success).toBe(true);
    });
  });
});
