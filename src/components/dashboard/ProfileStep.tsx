"use client";

import { useState } from "react";

import { Card, StepHeader } from "@/components/dashboard/Card";
import { DetailsForm } from "@/components/dashboard/DetailsForm";
import { ResumeUpload } from "@/components/dashboard/ResumeUpload";
import { Alert } from "@/components/ui";
import { ApiError, api, type Dashboard } from "@/lib/api";

type Tab = "resume" | "details";

export function ProfileStep({ data, onChange }: { data: Dashboard; onChange: (d: Dashboard) => void }) {
  // The open tab is the input the AI uses (uploaded resume or entered details).
  const [tab, setTab] = useState<Tab>(data.customization_input ?? "resume");
  const [error, setError] = useState<string | null>(null);

  const tabs: { id: Tab; title: string; sub: string; done: boolean }[] = [
    {
      id: "resume",
      title: "Upload resume",
      sub: "Quickest — we read it for you",
      done: !!data.resume,
    },
    {
      id: "details",
      title: "Fill in details",
      sub: "No resume? Enter it manually",
      done: !!data.details,
    },
  ];

  const choose = async (next: Tab) => {
    setTab(next);
    setError(null);
    const exists = next === "resume" ? !!data.resume : !!data.details;
    // Only switch the AI's input if that input exists; otherwise it's selected once uploaded/saved.
    if (!exists || data.customization_input === next) return;
    try {
      onChange(await api.selectInput(next));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't switch input. Try again.");
    }
  };

  return (
    <Card id="profile">
      <StepHeader
        step={1}
        title="Tell us about yourself"
        description="Upload your resume, or fill in your experience, skills and projects. The option you choose here is what your tailored resume is based on."
        done={data.ready_for_job_description}
      />

      <div
        role="tablist"
        aria-label="How do you want to add your details?"
        className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => void choose(t.id)}
            className={`rounded-lg px-3 py-2 text-left transition ${
              tab === t.id
                ? "bg-white shadow-sm dark:bg-zinc-900"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <span className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
              {t.title}
              {t.done && (
                <span className="text-green-600" aria-label="(done)">
                  ✓
                </span>
              )}
            </span>
            <span className="hidden text-xs text-zinc-500 sm:block">{t.sub}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-3">
          <Alert>{error}</Alert>
        </div>
      )}

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-5">
        {tab === "resume" ? (
          <ResumeUpload data={data} onChange={onChange} />
        ) : (
          <DetailsForm data={data} onSaved={onChange} />
        )}
      </div>
    </Card>
  );
}
