"use client";

import { useRef, useState } from "react";

import { Avatar } from "@/components/dashboard/Avatar";
import { Card } from "@/components/dashboard/Card";
import { ApiError, api, type Dashboard } from "@/lib/api";
import { checkPhotoFile, timeAgo } from "@/lib/profile";

const RING_SIZE = 112;
const STROKE = 5;

function CompletionRing({ percent, children }: { percent: number; children: React.ReactNode }) {
  const r = (RING_SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * r;
  // Full class names so Tailwind can find them.
  const [stroke, text] =
    percent >= 80
      ? ["stroke-green-500", "text-green-600"]
      : percent >= 40
        ? ["stroke-amber-500", "text-amber-600"]
        : ["stroke-red-500", "text-red-600"];
  return (
    <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
      <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90" aria-hidden>
        <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={r} fill="none" strokeWidth={STROKE} className="stroke-zinc-200 dark:stroke-zinc-800" />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={r}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          className={`${stroke} transition-[stroke-dashoffset] duration-700`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
      <span
        className={`absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white px-2 text-xs font-semibold dark:bg-zinc-900 ${text}`}
      >
        {percent}%
      </span>
    </div>
  );
}

const NAV = [
  { href: "#home", label: "My home", icon: "⌂" },
  { href: "#profile", label: "Profile & resume", icon: "☰" },
  { href: "#job-description", label: "Job description", icon: "✎" },
  { href: "#customize", label: "Customize resume", icon: "✨" },
];

export function ProfileSidebar({ data, onChange }: { data: Dashboard; onChange: (d: Dashboard) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, completion, details } = data;

  const lastUpdated = [data.details_updated_at, data.resume?.uploaded_at]
    .filter((d): d is string => !!d)
    .sort()
    .at(-1);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    const problem = checkPhotoFile(file);
    if (problem) return setError(problem);
    setBusy(true);
    try {
      onChange(await api.uploadPhoto(file));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed. Try again.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      onChange(await api.deletePhoto());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't remove the photo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="space-y-4 lg:sticky lg:top-20">
      <Card className="text-center">
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="group relative rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
            aria-label={data.photo_version ? "Change profile photo" : "Upload profile photo"}
          >
            <CompletionRing percent={completion.percent}>
              <Avatar name={user.full_name} photoVersion={data.photo_version} size={RING_SIZE - 20} />
            </CompletionRing>
            <span className="absolute inset-[10px] grid place-items-center rounded-full bg-black/50 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
              {busy ? "Uploading…" : data.photo_version ? "Change photo" : "Add photo"}
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => upload(e.target.files?.[0])}
          />
          {data.photo_version && (
            <button type="button" onClick={remove} disabled={busy} className="mt-4 text-xs text-zinc-500 hover:text-red-600">
              Remove photo
            </button>
          )}
          {error && (
            <p role="alert" className="mt-3 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        <h2 className="mt-5 text-lg font-semibold uppercase tracking-tight">{user.full_name}</h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {details?.headline ?? <span className="text-zinc-400">Add a headline</span>}
        </p>
        {details && (
          <p className="text-xs text-zinc-500">
            {details.experience_level === "fresher" ? "Fresher" : `${details.years_experience} yrs experience`}
          </p>
        )}
        <p className="mt-1 truncate text-xs text-zinc-500">{user.email}</p>
        {lastUpdated && <p className="mt-1 text-xs text-zinc-400">Last updated {timeAgo(lastUpdated)}</p>}

        {completion.percent < 100 && (
          <a
            href="#profile"
            className="mt-4 inline-flex rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Complete profile
          </a>
        )}
      </Card>

      {completion.missing.length > 0 && (
        <Card className="bg-indigo-50/60 dark:bg-indigo-950/30">
          <h3 className="text-sm font-semibold">Profile strength</h3>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Add these to reach 100%:</p>
          <ul className="mt-2 space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
            {completion.missing.map((m) => (
              <li key={m}>○ {m}</li>
            ))}
          </ul>
        </Card>
      )}

      <nav aria-label="Dashboard" className="rounded-2xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
        {NAV.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <span aria-hidden className="w-4 text-center">
              {item.icon}
            </span>
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
