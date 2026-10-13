"use client";

import { useRef, useState } from "react";

import { Alert, SecondaryButton } from "@/components/ui";
import { ApiError, api, type Dashboard } from "@/lib/api";
import { checkResumeFile, formatBytes, timeAgo } from "@/lib/profile";

export function ResumeUpload({ data, onChange }: { data: Dashboard; onChange: (d: Dashboard) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ name: string; size: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resume = data.resume;

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    const problem = checkResumeFile(file);
    if (problem) return setError(problem);
    setUploading({ name: file.name, size: file.size });
    try {
      onChange(await api.uploadResume(file));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed. Try again.");
    } finally {
      setUploading(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async () => {
    setError(null);
    try {
      onChange(await api.deleteResume());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't remove the resume.");
    }
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      className="hidden"
      onChange={(e) => upload(e.target.files?.[0])}
    />
  );

  if (uploading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-600" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{uploading.name}</p>
          <p className="text-xs text-zinc-500">{formatBytes(uploading.size)} · Uploading and reading your resume…</p>
        </div>
      </div>
    );
  }

  if (resume) {
    return (
      <div className="space-y-3">
        {error && <Alert>{error}</Alert>}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-red-50 text-xs font-bold text-red-600 dark:bg-red-950 dark:text-red-300">
            {resume.filename.toLowerCase().endsWith(".pdf") ? "PDF" : "DOC"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{resume.filename}</p>
            <p className="text-xs text-zinc-500">
              {formatBytes(resume.size)}
              {resume.page_count ? ` · ${resume.page_count} page${resume.page_count > 1 ? "s" : ""}` : ""} ·{" "}
              {resume.word_count} words · uploaded {timeAgo(resume.uploaded_at)}
            </p>
          </div>
          <div className="flex gap-2">
            <SecondaryButton onClick={() => inputRef.current?.click()}>Replace</SecondaryButton>
            <SecondaryButton onClick={remove} className="hover:border-red-300 hover:text-red-600">
              Remove
            </SecondaryButton>
          </div>
          {fileInput}
        </div>
        <details className="group rounded-xl border border-zinc-200 dark:border-zinc-800">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium">
            Text we extracted from your resume
          </summary>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap border-t border-zinc-200 px-4 py-3 font-sans text-xs leading-relaxed text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
            {resume.preview}
            {resume.preview.length >= 1500 && "\n…"}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <Alert>{error}</Alert>}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), inputRef.current?.click())}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void upload(e.dataTransfer.files?.[0]);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition focus-visible:outline-2 focus-visible:outline-indigo-600 ${
          dragging
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
            : "border-zinc-300 hover:border-indigo-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50"
        }`}
      >
        <span className="text-3xl" aria-hidden>
          📄
        </span>
        <p className="mt-2 text-sm font-medium">
          <span className="text-indigo-600 dark:text-indigo-400">Click to upload</span> or drag and drop your resume
        </p>
        <p className="mt-1 text-xs text-zinc-500">PDF or DOCX, up to 5 MB</p>
      </div>
      {/* Outside the drop zone so the input's click doesn't bubble back into it. */}
      {fileInput}
    </div>
  );
}
