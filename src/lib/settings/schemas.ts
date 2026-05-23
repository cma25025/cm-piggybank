import { z } from "zod";

export const KidProfileSchema = z.object({
  display_name: z.string().trim().min(1, "Name is required").max(60),
  age: z.coerce.number().int().min(0).max(25),
  avatar_emoji: z.string().trim().min(1).max(8).default("🐷"),
});
export type KidProfileInput = z.infer<typeof KidProfileSchema>;

export const DistributionSchema = z
  .object({
    spend_pct: z.coerce.number().int().min(0).max(100),
    save_pct: z.coerce.number().int().min(0).max(100),
    share_pct: z.coerce.number().int().min(0).max(100),
  })
  .refine((d) => d.spend_pct + d.save_pct + d.share_pct === 100, {
    message: "Percentages must add up to 100",
    path: ["spend_pct"],
  });
export type DistributionInput = z.infer<typeof DistributionSchema>;

const PASSWORD = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long");

export const ChangePasswordSchema = z
  .object({
    new_password: PASSWORD,
    confirm: PASSWORD,
  })
  .refine((d) => d.new_password === d.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export const DeletePiggybankSchema = z.object({
  confirm: z
    .string()
    .refine((v) => v === "DELETE", "Type DELETE to confirm"),
});
