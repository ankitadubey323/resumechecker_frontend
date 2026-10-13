// Client-side rules. The backend (backend/app/validators.py) enforces the same
// rules again; these exist only to give instant feedback.
import { isValidPhoneNumber, parsePhoneNumberWithError, type CountryCode } from "libphonenumber-js";
import { z } from "zod";

export const PASSWORD_RULES = [
  // bcrypt only uses the first 72 bytes, so cap length (and bytes, for non-English characters).
  {
    id: "length",
    label: "8–64 characters",
    test: (p: string) => p.length >= 8 && p.length <= 64 && new TextEncoder().encode(p).length <= 72,
  },
  { id: "lower", label: "A lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { id: "upper", label: "An uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "digit", label: "A number", test: (p: string) => /\d/.test(p) },
  { id: "special", label: "A special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

const email = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .pipe(z.email("Enter a valid email address"));

export const signupSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(1, "Full name is required")
      .regex(/^[A-Za-z][A-Za-z .'\-]{1,99}$/, "Use 2–100 letters, spaces, . ' or -"),
    email,
    country: z.string().min(2, "Select a country"),
    phone: z.string().trim().min(1, "Phone number is required").max(20, "Phone number is too long"),
    password: z.string().min(1, "Password is required"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .superRefine((v, ctx) => {
    if (v.phone && !isValidPhoneNumber(v.phone, v.country as CountryCode)) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Enter a valid phone number for the selected country" });
    }

    const failed = PASSWORD_RULES.filter((r) => !r.test(v.password));
    if (v.password && failed.length) {
      ctx.addIssue({ code: "custom", path: ["password"], message: "Password doesn't meet all the requirements below" });
    } else if (v.password !== v.password.trim()) {
      ctx.addIssue({ code: "custom", path: ["password"], message: "Password can't start or end with a space" });
    } else {
      const local = v.email.split("@")[0]?.toLowerCase() ?? "";
      if (local.length >= 3 && v.password.toLowerCase().includes(local)) {
        ctx.addIssue({ code: "custom", path: ["password"], message: "Password can't contain your email address" });
      }
    }

    if (v.confirm_password && v.password !== v.confirm_password) {
      ctx.addIssue({ code: "custom", path: ["confirm_password"], message: "Passwords do not match" });
    }
  });

export type SignupForm = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(500),
});

export type LoginForm = z.infer<typeof loginSchema>;

export function toE164(phone: string, country: string): string {
  return parsePhoneNumberWithError(phone, country as CountryCode).number;
}
