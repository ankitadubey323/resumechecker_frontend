import { PASSWORD_RULES } from "@/lib/validation";

export function PasswordChecklist({ password }: { password: string }) {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const bar = ["bg-zinc-200 dark:bg-zinc-800", "bg-red-500", "bg-red-500", "bg-amber-500", "bg-amber-500", "bg-green-500"][passed];

  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden>
        {PASSWORD_RULES.map((r, i) => (
          <div key={r.id} className={`h-1 flex-1 rounded-full ${i < passed ? bar : "bg-zinc-200 dark:bg-zinc-800"}`} />
        ))}
      </div>
      <ul className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-2" aria-label="Password requirements">
        {PASSWORD_RULES.map((r) => {
          const ok = r.test(password);
          return (
            <li key={r.id} className={ok ? "text-green-600 dark:text-green-400" : "text-zinc-500"}>
              <span aria-hidden>{ok ? "✓" : "○"}</span> {r.label}
              <span className="sr-only">{ok ? " (met)" : " (not met)"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
