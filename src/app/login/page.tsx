"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";

import { Alert, AuthShell, Button, Field, PasswordField } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { loginSchema, type LoginForm } from "@/lib/validation";

/** Only allow same-site relative paths, so ?next= can't redirect to another site. */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}

function LoginForm() {
  const params = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginForm) => {
    setFormError(null);
    try {
      await api.login(values);
      // Full page load, not router.replace: the client router may have cached
      // "/ -> /login" from a prefetch made while logged out.
      window.location.replace(safeNext(params.get("next")));
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {formError && <Alert>{formError}</Alert>}

      <Field
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />
      <PasswordField label="Password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />

      <Button type="submit" loading={isSubmitting}>
        {isSubmitting ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle={
        <>
          New here?{" "}
          <Link href="/signup" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="h-56" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
