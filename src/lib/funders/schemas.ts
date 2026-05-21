import { z } from "zod";

const NAME = z.string().trim().min(1, "Name is required").max(80, "Name is too long");
const RELATIONSHIP = z
  .string()
  .trim()
  .max(40, "Relationship is too long")
  .optional()
  .nullable()
  .transform((v) => (v && v.length > 0 ? v : null));

export const AddFunderSchema = z.object({
  display_name: NAME,
  relationship: RELATIONSHIP,
});
export type AddFunderInput = z.infer<typeof AddFunderSchema>;

export const EditFunderSchema = z.object({
  funder_id: z.string().uuid(),
  display_name: NAME,
  relationship: RELATIONSHIP,
});

export const ArchiveFunderSchema = z.object({
  funder_id: z.string().uuid(),
});
