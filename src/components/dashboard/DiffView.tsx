"use client";

import { diffLines, diffWordsWithSpace } from "diff";
import { useMemo } from "react";

type Row =
  | { kind: "same"; text: string }
  | { kind: "added"; text: string }
  | { kind: "removed"; text: string }
  | { kind: "changed"; parts: { text: string; added: boolean; removed: boolean }[] };

/** One line per bullet/paragraph, without bullet symbols, so formatting doesn't count as a change. */
function normalize(text: string): string {
  return text
    .split("\n")
    .map((l) =>
      l
        .replace(/^[\s•●▪◦*\-–]+/, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((l) => l && !/^-+$/.test(l))
    .join("\n");
}

function lines(value: string): string[] {
  return value.replace(/\n$/, "").split("\n");
}

function buildRows(before: string, after: string): Row[] {
  const rows: Row[] = [];
  const hunks = diffLines(normalize(before), normalize(after));
  for (let i = 0; i < hunks.length; i++) {
    const h = hunks[i];
    const next = hunks[i + 1];
    if (h.removed && next?.added) {
      // A removed block followed by an added one = rewritten lines: pair them up and diff word by word.
      const old = lines(h.value);
      const neu = lines(next.value);
      const n = Math.max(old.length, neu.length);
      for (let j = 0; j < n; j++) {
        if (old[j] !== undefined && neu[j] !== undefined) {
          rows.push({
            kind: "changed",
            parts: diffWordsWithSpace(old[j], neu[j]).map((p) => ({
              text: p.value,
              added: !!p.added,
              removed: !!p.removed,
            })),
          });
        } else if (old[j] !== undefined) rows.push({ kind: "removed", text: old[j] });
        else rows.push({ kind: "added", text: neu[j] });
      }
      i++;
    } else {
      for (const text of lines(h.value)) rows.push({ kind: h.added ? "added" : h.removed ? "removed" : "same", text });
    }
  }
  return rows;
}

export function DiffView({ before, after }: { before: string; after: string }) {
  const rows = useMemo(() => buildRows(before, after), [before, after]);
  const stats = rows.reduce(
    (acc, r) => {
      if (r.kind === "added") acc.added++;
      else if (r.kind === "removed") acc.removed++;
      else if (r.kind === "changed") acc.changed++;
      return acc;
    },
    { added: 0, removed: 0, changed: 0 },
  );

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-3 text-xs">
        <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-800 dark:bg-green-950 dark:text-green-300">
          + {stats.added} added
        </span>
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          ~ {stats.changed} rewritten
        </span>
        <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-800 dark:bg-red-950 dark:text-red-300">
          − {stats.removed} removed
        </span>
      </div>
      <div className="max-h-[640px] overflow-auto rounded-xl border border-zinc-200 bg-white font-mono text-xs leading-relaxed dark:border-zinc-800 dark:bg-zinc-950">
        {rows.map((r, i) => {
          if (r.kind === "changed") {
            return (
              <p key={i} className="border-l-4 border-amber-400 bg-amber-50/50 px-3 py-1 dark:bg-amber-950/20">
                {r.parts.map((p, j) =>
                  p.added ? (
                    <ins key={j} className="rounded bg-green-200 no-underline dark:bg-green-900/70">
                      {p.text}
                    </ins>
                  ) : p.removed ? (
                    <del key={j} className="rounded bg-red-200 text-red-900 dark:bg-red-900/60 dark:text-red-200">
                      {p.text}
                    </del>
                  ) : (
                    <span key={j}>{p.text}</span>
                  ),
                )}
              </p>
            );
          }
          const style = {
            same: "border-transparent text-zinc-600 dark:text-zinc-400",
            added: "border-green-500 bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-200",
            removed: "border-red-500 bg-red-50 text-red-900 line-through dark:bg-red-950/40 dark:text-red-200",
          }[r.kind];
          return (
            <p key={i} className={`border-l-4 px-3 py-1 ${style}`}>
              <span aria-hidden className="mr-2 select-none opacity-60">
                {r.kind === "added" ? "+" : r.kind === "removed" ? "−" : " "}
              </span>
              {r.text}
            </p>
          );
        })}
      </div>
    </div>
  );
}
