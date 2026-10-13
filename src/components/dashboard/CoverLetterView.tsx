"use client";

import { useState } from "react";

import { Alert, Button, SecondaryButton } from "@/components/ui";
import { timeAgo } from "@/lib/profile";
import type { CustomizationState } from "@/lib/useCustomization";

export function CoverLetterView({ cz }: { cz: CustomizationState }) {
  const [copied, setCopied] = useState(false);
  const saved = cz.customization?.cover_letter ?? null;
  const streaming = cz.coverStream !== null;
  const text = cz.coverStream ?? saved?.text ?? "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; the text is still selectable */
    }
  };

  return (
    <div className="space-y-4">
      {cz.coverError && <Alert>{cz.coverError}</Alert>}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void cz.generateCoverLetter()} loading={streaming} className="sm:w-auto! sm:px-6">
          {streaming ? "Writing…" : saved ? "✨ Rewrite cover letter" : "✨ Write a cover letter"}
        </Button>
        {saved && !streaming && (
          <>
            <SecondaryButton onClick={() => void copy()}>{copied ? "✓ Copied" : "Copy"}</SecondaryButton>
            {(["pdf", "docx", "txt"] as const).map((f) => (
              <SecondaryButton key={f} onClick={() => void cz.download(f, "cover-letter")} disabled={!!cz.downloading}>
                {cz.downloading === `cover-letter:${f}` ? "…" : `⬇ ${f.toUpperCase()}`}
              </SecondaryButton>
            ))}
            <span className="text-xs text-zinc-500">Written {timeAgo(saved.created_at)}</span>
          </>
        )}
      </div>

      {text || streaming ? (
        <article
          aria-live="polite"
          aria-busy={streaming}
          className="mx-auto max-w-[760px] whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white px-6 py-8 text-sm leading-relaxed text-zinc-800 shadow-sm sm:px-10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
        >
          {text}
          {streaming && (
            <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-indigo-500 align-middle" aria-hidden />
          )}
        </article>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Get a short, specific cover letter for this job, based on this tailored resume. It appears here as the AI
          writes it.
        </p>
      )}
    </div>
  );
}
