import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().email("Enter a valid email"),
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
