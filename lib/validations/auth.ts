import { z } from "zod";

/** Accounts are limited to PCU-issued email addresses. */
export const ALLOWED_EMAIL_DOMAIN = "pcu.edu.ph";

const pcuEmail = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email")
  .refine((v) => v.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`), {
    message: `Use your PCU email (@${ALLOWED_EMAIL_DOMAIN})`,
  });

export const loginSchema = z.object({
  email: pcuEmail,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: pcuEmail,
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().trim().min(2, "Full name is required"),
  studentId: z.string().trim().min(1, "Student ID is required"),
  yearLevel: z.coerce
    .number<number>()
    .int("Year level must be 1-5")
    .min(1, "Year level must be 1-5")
    .max(5, "Year level must be 1-5"),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
export type RegisterValues = z.output<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: pcuEmail,
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
