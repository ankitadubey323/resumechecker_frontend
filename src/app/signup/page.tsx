"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { CountrySelect } from "@/components/CountrySelect";
import { PasswordChecklist } from "@/components/PasswordChecklist";
import { Alert, AuthShell, Button, Field, PasswordField } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { signupSchema, toE164, type SignupForm } from "@/lib/validation";

const SERVER_FIELDS = ["full_name", "email", "phone", "password", "confirm_password"] as const;

export default function SignupPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    getFieldState,
    trigger,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    defaultValues: { full_name: "", email: "", country: "US", phone: "", password: "", confirm_password: "" },
  });

  // Pre-select the country from the browser locale (e.g. en-IN -> IN).
  useEffect(() => {
    const region = new Intl.Locale(navigator.language).maximize().region;
    if (region && !getFieldState("country").isDirty) setValue("country", region);
  }, [getFieldState, setValue]);

  const password = useWatch({ control, name: "password" });

  // Re-check confirm_password when password changes after it was filled in.
  useEffect(() => {
    if (dirtyFields.confirm_password) void trigger("confirm_password");
  }, [password, dirtyFields.confirm_password, trigger]);

  const onSubmit = async (values: SignupForm) => {
    setFormError(null);
    try {
      await api.signup({
        full_name: values.full_name,
        email: values.email,
        phone: toE164(values.phone, values.country),
        password: values.password,
        confirm_password: values.confirm_password,
      });
      // Signup logs the user in; full page load so no cached logged-out redirect is reused.
      window.location.replace("/");
    } catch (err) {
      if (err instanceof ApiError && err.code === "email_taken") {
        setError("email", { message: err.message });
      } else if (err instanceof ApiError) {
        let mapped = false;
        for (const f of SERVER_FIELDS) {
          if (err.fieldErrors[f]) {
            setError(f, { message: err.fieldErrors[f] });
            mapped = true;
          }
        }
        if (!mapped) setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && <Alert>{formError}</Alert>}

        <Field label="Full name" autoComplete="name" placeholder="Jane Doe" error={errors.full_name?.message} {...register("full_name")} />

        <Field
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <Field
          label="Phone number"
          type="tel"
          autoComplete="tel-national"
          inputMode="tel"
          placeholder="555 123 4567"
          leading={<CountrySelect {...register("country", { onChange: () => dirtyFields.phone && trigger("phone") })} />}
          error={errors.phone?.message}
          {...register("phone")}
        />

        <div>
          <PasswordField label="Password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
          <PasswordChecklist password={password} />
        </div>

        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          error={errors.confirm_password?.message}
          {...register("confirm_password")}
        />

        <Button type="submit" loading={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
