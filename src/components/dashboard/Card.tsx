import type { ReactNode } from "react";

export function Card({ id, children, className = "" }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      {children}
    </section>
  );
}

export function StepHeader({
  step,
  title,
  description,
  done,
}: {
  step: number;
  title: string;
  description: ReactNode;
  done?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${
          done ? "bg-green-600 text-white" : "bg-indigo-600 text-white"
        }`}
        aria-hidden
      >
        {done ? "✓" : step}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold tracking-tight">
          {title}
          {done && (
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
              Done
            </span>
          )}
        </h2>
        <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>
    </div>
  );
}
