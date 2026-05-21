import { z } from "zod";

export const RECONCILE_REASONS = [
  { value: "rounding", label: "Rounding / cents drift" },
  { value: "cash_missing", label: "Cash went missing" },
  { value: "found_cash", label: "Found extra cash" },
  { value: "miscount", label: "I miscounted before" },
  { value: "other", label: "Other reason" },
] as const;

const REASON = z.enum(["rounding", "cash_missing", "found_cash", "miscount", "other"]);

export const ReconcileSchema = z.object({
  actual_total_dollars: z.coerce
    .number()
    .min(0, "Must be 0 or more")
    .max(1_000_000, "Way too much"),
  reason: REASON,
  note: z
    .string()
    .trim()
    .max(200, "Note is too long")
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type ReconcileInput = z.infer<typeof ReconcileSchema>;

export function reasonLabel(value: string): string {
  return RECONCILE_REASONS.find((r) => r.value === value)?.label ?? value;
}
