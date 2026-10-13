import type { Analysis, Priority } from "@/lib/api";

const PRIORITY_STYLE: Record<Priority, string> = {
  high: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900",
  medium: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900",
  low: "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
};
const PRIORITY_ORDER: Priority[] = ["high", "medium", "low"];

function Chips({ items, tone }: { items: string[]; tone: "good" | "bad" }) {
  if (!items.length) return <p className="text-sm text-zinc-500">None</p>;
  const style =
    tone === "good"
      ? "bg-green-50 text-green-800 ring-green-200 dark:bg-green-950/50 dark:text-green-300 dark:ring-green-900"
      : "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900";
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((k) => (
        <li key={k} className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${style}`}>
          {tone === "good" ? "✓ " : "+ "}
          {k}
        </li>
      ))}
    </ul>
  );
}

function Block({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h3 className="text-sm font-semibold">{title}</h3>
      {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function ImprovementsView({ analysis }: { analysis: Analysis }) {
  const suggestions = [...analysis.suggestions].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
  );

  return (
    <div className="space-y-4">
      <Block title="Points to improve" hint="Things only you can add. These would make the biggest difference for this job.">
        <ol className="space-y-2.5">
          {suggestions.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span
                className={`h-fit shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${PRIORITY_STYLE[s.priority]}`}
              >
                {s.priority}
              </span>
              <span>
                {s.suggestion} <span className="text-xs text-zinc-500">({s.area})</span>
              </span>
            </li>
          ))}
        </ol>
      </Block>

      <div className="grid gap-4 md:grid-cols-2">
        <Block title="Keywords you match" hint="Job keywords your resume already supports.">
          <Chips items={analysis.matched_keywords} tone="good" />
        </Block>
        <Block title="Missing keywords" hint="In the job post but not in your resume. Add them only if you really have them.">
          <Chips items={analysis.missing_keywords} tone="bad" />
        </Block>
      </div>

      {analysis.bullet_changes.length > 0 && (
        <Block title="What we changed" hint="Your original wording vs. the tailored version.">
          <ul className="space-y-4">
            {analysis.bullet_changes.map((c, i) => (
              <li key={i} className="text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{c.section}</p>
                <div className="mt-1 grid gap-2 md:grid-cols-2">
                  <p className="rounded-lg bg-red-50/70 px-3 py-2 text-zinc-700 line-through decoration-red-300 dark:bg-red-950/30 dark:text-zinc-400">
                    {c.original}
                  </p>
                  <p className="rounded-lg bg-green-50/70 px-3 py-2 dark:bg-green-950/30">{c.improved}</p>
                </div>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Why: {c.reason}</p>
              </li>
            ))}
          </ul>
        </Block>
      )}

      <Block title="What this job asks for" hint="Key requirements we tailored your resume against.">
        <ul className="grid gap-1 text-sm sm:grid-cols-2">
          {analysis.jd_requirements.map((r) => (
            <li key={r} className="flex gap-2">
              <span aria-hidden className="text-indigo-500">•</span>
              {r}
            </li>
          ))}
        </ul>
      </Block>
    </div>
  );
}
