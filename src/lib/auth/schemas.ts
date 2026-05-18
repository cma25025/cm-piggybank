import { z } from "zod";

const EMAIL = z.string().trim().toLowerCase().email("Enter a valid email address");
const PASSWORD = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long");

export const SignupSchema = z
  .object({
    email: EMAIL,
    password: PASSWORD,
    confirm: PASSWORD,
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });
export type SignupInput = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  email: EMAIL,
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({ email: EMAIL });
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z
  .object({
    password: PASSWORD,
    confirm: PASSWORD,
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
