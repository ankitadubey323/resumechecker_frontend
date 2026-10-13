"use client";

import Link from "next/link";
import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" prefetch={false} className="mb-8 flex items-center justify-center gap-2 text-sm font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">RC</span>
          Resume Customizer
        </Link>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: ReactNode;
  trailing?: ReactNode;
  leading?: ReactNode;
};

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, hint, trailing, leading, id, className, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="flex gap-2">
        {leading}
        <div className="relative flex-1">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-zinc-400 focus:ring-2 dark:bg-zinc-950 ${
              trailing ? "pr-16" : ""
            } ${
              error
                ? "border-red-500 focus:ring-red-500/30"
                : "border-zinc-300 focus:border-indigo-500 focus:ring-indigo-500/30 dark:border-zinc-700"
            }`}
            {...props}
          />
          {trailing && <div className="absolute inset-y-0 right-0 flex items-center pr-2">{trailing}</div>}
        </div>
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-zinc-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
});

export const PasswordField = forwardRef<HTMLInputElement, Omit<FieldProps, "type" | "trailing">>(
  function PasswordField(props, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <Field
        ref={ref}
        type={visible ? "text" : "password"}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="rounded px-2 py-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? "Hide" : "Show"}
          </button>
        }
        {...props}
      />
    );
  },
);

export function Button({
  loading,
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      disabled={loading || props.disabled}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
      {children}
    </button>
  );
}

export function Alert({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300",
    success: "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/50 dark:text-green-300",
    info: "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-lg border px-3 py-2.5 text-sm ${styles}`}>
      {children}
    </div>
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  hint?: ReactNode;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, id, className, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-zinc-400 focus:ring-2 dark:bg-zinc-950 ${
          error
            ? "border-red-500 focus:ring-red-500/30"
            : "border-zinc-300 focus:border-indigo-500 focus:ring-indigo-500/30 dark:border-zinc-700"
        }`}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        hint && (
          <div id={`${inputId}-hint`} className="mt-1.5 text-xs text-zinc-500">
            {hint}
          </div>
        )
      )}
    </div>
  );
});

export function SecondaryButton({ className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 ${className}`}
      {...props}
    />
  );
}
