import type { AtsReport } from "@/lib/api";

export function atsTone(score: number): { label: string; text: string; bar: string } {
  if (score >= 80) return { label: "Excellent", text: "text-green-600 dark:text-green-400", bar: "bg-green-500" };
  if (score >= 60) return { label: "Good", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" };
  return { label: "Needs work", text: "text-red-600 dark:text-red-400", bar: "bg-red-500" };
}

export function AtsView({ ats }: { ats: AtsReport }) {
  const tone = atsTone(ats.score);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="text-center">
          <p className={`text-4xl font-bold ${tone.text}`}>{ats.score}</p>
          <p className="text-xs text-zinc-500">out of 100</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            ATS-friendliness: <span className={tone.text}>{tone.label}</span>
          </p>
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
            How well applicant tracking systems can read and match this resume: keywords, standard sections and clear,
            quantified bullet points. Calculated with fixed rules, not by the AI.
          </p>
          <div className="mt-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div className={`h-2 rounded-full ${tone.bar}`} style={{ width: `${ats.score}%` }} />
          </div>
        </div>
      </div>

      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {ats.checks.map((c) => (
          <li key={c.label} className="flex items-start gap-3 p-3 text-sm">
            <span
              aria-label={c.passed ? "passed" : "needs work"}
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${
                c.passed ? "bg-green-500" : "bg-amber-500"
              }`}
            >
              {c.passed ? "✓" : "!"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{c.label}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">{c.detail}</p>
            </div>
            <span className="shrink-0 text-xs tabular-nums text-zinc-500">
              {Math.round(c.points)}/{c.max_points}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
