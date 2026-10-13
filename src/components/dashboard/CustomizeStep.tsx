"use client";

import { useState } from "react";

import { AtsView, atsTone } from "@/components/dashboard/AtsView";
import { Card, StepHeader } from "@/components/dashboard/Card";
import { CoverLetterView } from "@/components/dashboard/CoverLetterView";
import { DiffView } from "@/components/dashboard/DiffView";
import { ImprovementsView } from "@/components/dashboard/ImprovementsView";
import { ResumePreview } from "@/components/dashboard/ResumePreview";
import { Alert, Button, SecondaryButton } from "@/components/ui";
import { ALL_SECTIONS, type Dashboard, type Section } from "@/lib/api";
import { timeAgo } from "@/lib/profile";
import { PROGRESS_STEPS, type CustomizationState } from "@/lib/useCustomization";

type Tab = "resume" | "changes" | "improvements" | "ats" | "cover";

const SECTION_LABELS: Record<Section, string> = {
  summary: "Summary",
  skills: "Skills",
  experience: "Experience",
  projects: "Projects",
};

function ScoreBar({ label, value, tone }: { label: string; value: number; tone: "muted" | "accent" }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
        <span className="font-semibold">{Math.round(value)}%</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-2 rounded-full transition-[width] duration-700 ${tone === "accent" ? "bg-green-500" : "bg-zinc-400"}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function Locked({ hasProfile }: { hasProfile: boolean }) {
  return (
    <div className="mt-5 flex items-center gap-3 rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
      <span aria-hidden className="text-lg">
        🔒
      </span>
      <span>
        Complete{" "}
        {hasProfile ? (
          <a href="#job-description" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            step 2 (job description)
          </a>
        ) : (
          <>
            <a href="#profile" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              step 1
            </a>{" "}
            and{" "}
            <a href="#job-description" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              step 2
            </a>
          </>
        )}{" "}
        to unlock AI customization.
      </span>
    </div>
  );
}

/** Section-wise customization: choose which sections the AI may rewrite. */
function SectionPicker({ cz }: { cz: CustomizationState }) {
  const toggle = (s: Section) =>
    cz.setSections(
      cz.sections.includes(s)
        ? cz.sections.filter((x) => x !== s)
        : ALL_SECTIONS.filter((x) => x === s || cz.sections.includes(x)),
    );
  return (
    <fieldset>
      <legend className="text-sm font-medium">Sections to tailor</legend>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {ALL_SECTIONS.map((s) => {
          const on = cz.sections.includes(s);
          const onlyOne = on && cz.sections.length === 1;
          return (
            <label
              key={s}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500/40 ${
                on
                  ? "border-indigo-500 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200"
                  : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
              } ${onlyOne ? "cursor-not-allowed" : ""}`}
              title={onlyOne ? "Keep at least one section selected" : undefined}
            >
              <input
                type="checkbox"
                checked={on}
                disabled={onlyOne}
                onChange={() => toggle(s)}
                className="accent-indigo-600"
              />
              {SECTION_LABELS[s]}
            </label>
          );
        })}
      </div>
      <p className="mt-1 text-xs text-zinc-500">Unchecked sections are kept as you wrote them.</p>
    </fieldset>
  );
}

function VersionPicker({ cz }: { cz: CustomizationState }) {
  if (cz.versions.length < 2 || !cz.customization) return null;
  const n = cz.versions.length;
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-medium">Version</span>
      <select
        value={cz.customization.id}
        onChange={(e) => cz.selectVersion(e.target.value)}
        className="max-w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
      >
        {cz.versions.map((v, i) => (
          <option key={v.id} value={v.id}>
            v{n - i} · {timeAgo(v.created_at)} · {v.sections.length === 4 ? "all sections" : v.sections.join(", ")} ·
            ATS {v.ats_score}
            {i === 0 ? " (latest)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

/** "Changes" tab: compare this version with the original input or with another version. */
function ChangesTab({ cz }: { cz: CustomizationState }) {
  const [against, setAgainst] = useState<string>("original");
  const current = cz.customization!;
  const others = cz.versions.filter((v) => v.id !== current.id);
  const n = cz.versions.length;
  const other = against === "original" ? null : cz.getVersion(against);
  const before = against === "original" ? current.input_text : other?.tailored_text;

  return (
    <div className="space-y-3">
      <label className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">Compare with</span>
        <select
          value={against}
          onChange={(e) => {
            setAgainst(e.target.value);
            if (e.target.value !== "original") cz.loadVersion(e.target.value);
          }}
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="original">Your original {current.source === "details" ? "details" : "resume"}</option>
          {others.map((v) => (
            <option key={v.id} value={v.id}>
              Version v{n - cz.versions.findIndex((x) => x.id === v.id)} ({timeAgo(v.created_at)})
            </option>
          ))}
        </select>
      </label>
      {before == null ? (
        <p className="text-sm text-zinc-500">
          {against === "original"
            ? "The original text isn't stored for this older version. Regenerate to compare."
            : "Loading that version…"}
        </p>
      ) : (
        <DiffView before={before} after={current.tailored_text} />
      )}
    </div>
  );
}

export function CustomizeStep({ data, customization: cz }: { data: Dashboard; customization: CustomizationState }) {
  const [tab, setTab] = useState<Tab>("resume");
  const { customization, loadingLatest, running, progress, error, downloading, run, download } = cz;

  const outdated =
    customization?.id === data.latest_customization?.id && (data.latest_customization?.outdated ?? false);
  const result = customization?.result;

  const tabs: [Tab, string][] = result
    ? [
        ["resume", "Tailored resume"],
        ["changes", "Changes"],
        ["improvements", `Improvements (${result.analysis.suggestions.length})`],
        ["ats", `ATS check (${customization!.ats.score})`],
        ["cover", "Cover letter"],
      ]
    : [];

  return (
    <Card id="customize" className={data.ready_for_customization ? "" : "opacity-70"}>
      <StepHeader
        step={3}
        title="Customize your resume with AI"
        description="We tailor your resume to the job: a rewritten summary, reordered skills, sharper bullet points, and what to improve."
        done={!!customization && !outdated}
      />

      {!data.ready_for_customization ? (
        <Locked hasProfile={data.ready_for_job_description} />
      ) : (
        <div className="mt-5 space-y-4">
          {error && <Alert>{error}</Alert>}

          {running ? (
            <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
              <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-700" />
              <div>
                <p className="font-medium">{PROGRESS_STEPS[progress]}</p>
                <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80">This usually takes 10–30 seconds.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                Based on:{" "}
                <strong>
                  {data.customization_input === "details"
                    ? "the details you entered"
                    : `your uploaded resume${data.resume ? ` (${data.resume.filename})` : ""}`}
                </strong>{" "}
                <span className="text-xs text-zinc-500">
                  — chosen in step 1. Switch the tab there (
                  {data.customization_input === "details" ? "Upload resume" : "Fill in details"}) to use the other
                  input; each keeps its own result.
                </span>
              </p>
              <SectionPicker cz={cz} />
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => void run()} className="sm:w-auto! sm:px-6">
                  {customization ? "✨ Generate new version" : "✨ Customize my resume"}
                </Button>
                <VersionPicker cz={cz} />
              </div>
            </div>
          )}

          {outdated && customization && !running && (
            <Alert tone="info">
              Your input or job description changed since this was generated. Click{" "}
              <strong>Generate new version</strong> to update it.
            </Alert>
          )}

          {loadingLatest && !customization && <p className="text-sm text-zinc-500">Loading your last result…</p>}

          {result && customization && (
            <div className={`space-y-4 ${running ? "pointer-events-none opacity-50" : ""}`}>
              {/* Scores + downloads */}
              <div className="grid gap-4 rounded-xl bg-zinc-50 p-4 md:grid-cols-[1fr_auto_auto] dark:bg-zinc-800/50">
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Job match (AI estimate)</p>
                  <ScoreBar label="Original resume" value={result.analysis.match_score_before} tone="muted" />
                  <ScoreBar label="Tailored resume" value={result.analysis.match_score_after} tone="accent" />
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">{result.analysis.score_explanation}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab("ats")}
                  className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-3 hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-900"
                  title="See the ATS checklist"
                >
                  <span className={`text-3xl font-bold ${atsTone(customization.ats.score).text}`}>
                    {customization.ats.score}
                  </span>
                  <span className="text-xs font-medium text-zinc-500">ATS score</span>
                </button>
                <div className="flex flex-row flex-wrap items-start gap-2 md:flex-col">
                  <p className="w-full text-xs font-medium text-zinc-500">Download resume</p>
                  {(["pdf", "docx", "txt"] as const).map((f) => (
                    <SecondaryButton key={f} onClick={() => download(f)} disabled={!!downloading} className="md:w-28">
                      {downloading === `resume:${f}` ? "…" : `⬇ ${f.toUpperCase()}`}
                    </SecondaryButton>
                  ))}
                </div>
              </div>

              {customization.sections.length < 4 && (
                <p className="text-xs text-zinc-500">
                  Tailored sections: {customization.sections.map((s) => SECTION_LABELS[s]).join(", ")}. Other sections
                  were kept as you wrote them.
                </p>
              )}

              <div
                role="tablist"
                aria-label="Result"
                className="flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800"
              >
                {tabs.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={tab === id}
                    onClick={() => setTab(id)}
                    className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-medium ${
                      tab === id
                        ? "border-indigo-600 text-indigo-700 dark:text-indigo-300"
                        : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {tab === "resume" && <ResumePreview resume={result.resume} />}
              {tab === "changes" && <ChangesTab key={customization.id} cz={cz} />}
              {tab === "improvements" && <ImprovementsView analysis={result.analysis} />}
              {tab === "ats" && <AtsView ats={customization.ats} />}
              {tab === "cover" && <CoverLetterView cz={cz} />}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
