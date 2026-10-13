"use client";

import { useId, useState } from "react";

type Props = {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  max?: number;
  maxLength?: number;
};

/** Type a value and press Enter or comma to add it; Backspace on an empty input removes the last one. */
export function TagInput({ label, value, onChange, placeholder, error, hint, max = 50, maxLength = 40 }: Props) {
  const id = useId();
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const items = raw
      .split(",")
      .map((s) => s.trim().replace(/\s+/g, " ").slice(0, maxLength))
      .filter(Boolean);
    const next = [...value];
    for (const item of items) {
      if (next.length >= max) break;
      if (!next.some((v) => v.toLowerCase() === item.toLowerCase())) next.push(item);
    }
    onChange(next);
    setDraft("");
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div
        className={`flex flex-wrap items-center gap-1.5 rounded-lg border bg-white px-2 py-1.5 focus-within:ring-2 dark:bg-zinc-950 ${
          error
            ? "border-red-500 focus-within:ring-red-500/30"
            : "border-zinc-300 focus-within:border-indigo-500 focus-within:ring-indigo-500/30 dark:border-zinc-700"
        }`}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v !== tag))}
              aria-label={`Remove ${tag}`}
              className="text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-100"
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          maxLength={maxLength * 3}
          onChange={(e) => (e.target.value.includes(",") ? add(e.target.value) : setDraft(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (draft.trim()) add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={value.length ? "" : placeholder}
          aria-invalid={!!error}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-zinc-400"
        />
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>
      )}
    </div>
  );
}
