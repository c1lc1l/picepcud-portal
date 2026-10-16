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

/** Member details, shared by registration and the dashboard profile editor. */
const profileFields = {
  fullName: z
    .string()
    .trim()
    .min(2, "Full name is required")
    .max(120, "Keep the name under 120 characters"),
  studentId: z
    .string()
    .trim()
    .min(1, "Student ID is required")
    .max(40, "Keep the student ID under 40 characters"),
  yearLevel: z.coerce
    .number<number>()
    .int("Year level must be 1-5")
    .min(1, "Year level must be 1-5")
    .max(5, "Year level must be 1-5"),
};

export const registerSchema = z.object({
  email: pcuEmail,
  password: z.string().min(8, "Password must be at least 8 characters"),
  ...profileFields,
});

export const profileSchema = z.object(profileFields);

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
export type RegisterValues = z.output<typeof registerSchema>;
export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileValues = z.output<typeof profileSchema>;

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
