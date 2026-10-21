import { z } from "zod";

const email = z.string().min(1, "Enter your email").email("Enter a valid email address");

export const passwordChecks = (pw: string) => ({
  length: pw.length >= 8,
  upper: /[A-Z]/.test(pw),
  number: /\d/.test(pw),
  symbol: /[^A-Za-z0-9]/.test(pw),
});

const password = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use 72 characters or fewer")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

export const signupSchema = z
  .object({ email, password, confirmPassword: z.string().min(1, "Confirm your password") })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });
export type SignupValues = z.infer<typeof signupSchema>;

export const signinSchema = z.object({ email, password: z.string().min(1, "Enter your password") });
export type SigninValues = z.infer<typeof signinSchema>;

const dob = z
  .string()
  .min(1, "Pick a date of birth")
  .refine((v) => new Date(v) <= new Date(), "Date of birth can't be in the future");
const gender = z.enum(["male", "female", "other"], { message: "Select a gender" });
const countryCode = z.string().regex(/^\+\d{1,4}$/, "Select a country code");

export const memberSchema = z.object({
  name: z.string().trim().min(2, "Enter a name"),
  relationship: z.enum(["spouse", "child", "parent", "sibling", "other"], {
    message: "Select a relationship",
  }),
  date_of_birth: dob,
  gender,
  email: z.union([z.literal(""), z.string().email("Enter a valid email address")]),
  phone_country_code: countryCode,
  phone: z.union([z.literal(""), z.string().regex(/^\d{6,14}$/, "Enter 6 to 14 digits")]),
});
export type MemberInput = z.infer<typeof memberSchema>;

export const setupSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name"),
  date_of_birth: dob,
  gender,
  phone_country_code: countryCode,
  phone: z.string().regex(/^\d{6,14}$/, "Enter 6 to 14 digits"),
  family_members: z.array(memberSchema),
});
export type SetupValues = z.infer<typeof setupSchema>;

export const otpRequestSchema = z.object({ email });
export const resetSchema = z
  .object({
    otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
    newPassword: password,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });
