"use client";

import { useState } from "react";

import { Card, StepHeader } from "@/components/dashboard/Card";
import { Button, Textarea } from "@/components/ui";
import { ApiError, api, type Dashboard } from "@/lib/api";
import { JD_MAX, JD_MIN, timeAgo } from "@/lib/profile";
import type { CustomizationState } from "@/lib/useCustomization";

type Props = {
  data: Dashboard;
  onChange: (d: Dashboard) => void;
  customization: CustomizationState;
};

export function JobDescriptionStep({ data, onChange, customization }: Props) {
  const saved = data.latest_job_description;
  // Show the saved job description so it can be read and edited.
  const [text, setText] = useState(saved?.text ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const locked = !data.ready_for_job_description;
  const length = text.trim().length;
  const edited = !!saved && text.trim() !== saved.text.trim();
  const busy = saving || customization.running;

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    if (!length) return setError("Paste the job description.");
    if (length < JD_MIN) return setError(`The job description looks too short (minimum ${JD_MIN} characters).`);
    if (length > JD_MAX) return setError(`The job description is too long (maximum ${JD_MAX.toLocaleString()} characters).`);
    setError(null);

    // Save only when it's new or changed; then send resume/details + JD to the AI.
    if (!saved || edited) {
      setSaving(true);
      try {
        onChange(await api.submitJobDescription(text));
      } catch (err) {
        setError(err instanceof ApiError ? (err.fieldErrors.text ?? err.message) : "Couldn't save. Try again.");
        return;
      } finally {
        setSaving(false);
      }
    }
    await customization.run();
  };

  return (
    <Card id="job-description" className={locked ? "opacity-70" : ""}>
      <StepHeader
        step={2}
        title="Paste the job description"
        description="Paste the full job post. When you submit, your resume and this job description are sent to the AI to create a tailored resume."
        done={!!saved}
      />

      {locked ? (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          <span aria-hidden className="text-lg">
            🔒
          </span>
          <span>
            Complete step 1 first —{" "}
            <a href="#profile" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              upload your resume or fill in your details
            </a>
            .
          </span>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-5 space-y-4">
          <Textarea
            label="Job description"
            rows={12}
            value={text}
            maxLength={JD_MAX + 1000}
            disabled={busy}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void submit();
            }}
            placeholder="e.g. We're looking for a Full Stack Developer with 2+ years of experience in React and Python…"
            error={error ?? undefined}
            hint={
              <span className="flex flex-wrap justify-between gap-2">
                <span>
                  {saved && !edited && `Saved ${timeAgo(saved.created_at)} · `}
                  {edited && <span className="font-medium text-amber-600">Edited, not saved yet · </span>}
                  Ctrl + Enter to submit
                </span>
                <span className={length > 0 && length < JD_MIN ? "text-amber-600" : ""}>
                  {length.toLocaleString()} / {JD_MAX.toLocaleString()} characters{length < JD_MIN ? ` (min ${JD_MIN})` : ""}
                </span>
              </span>
            }
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={busy} className="sm:w-auto! sm:px-6">
              {saving ? "Saving…" : customization.running ? "Customizing…" : "✨ Submit & customize resume"}
            </Button>
            {edited && !busy && (
              <button
                type="button"
                onClick={() => setText(saved.text)}
                className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Undo changes
              </button>
            )}
          </div>
        </form>
      )}
    </Card>
  );
}
