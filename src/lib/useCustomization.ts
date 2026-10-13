"use client";

import { useCallback, useEffect, useState } from "react";

import {
  ALL_SECTIONS,
  ApiError,
  api,
  type Customization,
  type Dashboard,
  type DownloadFormat,
  type Section,
  type VersionSummary,
} from "@/lib/api";

export const PROGRESS_STEPS = [
  "Reading the job description…",
  "Matching your experience to the requirements…",
  "Rewriting your summary and bullet points…",
  "Checking everything stays accurate…",
];

type InputSource = Customization["source"];

function message(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/** State for AI customization, shared by the job-description step (which starts it on
 *  submit) and the customize step (which shows the result, versions and cover letter). */
export function useCustomization(data: Dashboard | null, onDashboardChange: (d: Dashboard) => void) {
  const [sections, setSections] = useState<Section[]>(ALL_SECTIONS);
  const [versions, setVersions] = useState<Partial<Record<InputSource, VersionSummary[]>>>({});
  const [cache, setCache] = useState<Record<string, Customization>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [coverStream, setCoverStream] = useState<{ id: string; text: string } | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);

  const source = data?.customization_input ?? null;
  const latestId = data?.latest_customization?.id ?? null;
  const sourceVersions = source ? (versions[source] ?? []) : [];
  // Show the version the user picked (if it belongs to the current input), else the newest one.
  const activeId = selectedId && sourceVersions.some((v) => v.id === selectedId) ? selectedId : latestId;
  const customization = activeId ? (cache[activeId] ?? null) : null;
  const loadingLatest = !!activeId && !customization;

  // Version list for the selected input (refreshed whenever a new version is made).
  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    api
      .listVersions(source)
      .then((list) => !cancelled && setVersions((prev) => ({ ...prev, [source]: list })))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [source, latestId]);

  // Full details of the version being shown.
  useEffect(() => {
    if (!activeId || cache[activeId]) return;
    let cancelled = false;
    api
      .getCustomization(activeId)
      .then((c) => !cancelled && setCache((prev) => ({ ...prev, [c.id]: c })))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeId, cache]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setProgress((p) => Math.min(p + 1, PROGRESS_STEPS.length - 1)), 4000);
    return () => clearInterval(t);
  }, [running]);

  const run = useCallback(async () => {
    setError(null);
    setProgress(0);
    setRunning(true);
    document.getElementById("customize")?.scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      const c = await api.customize(sections);
      setCache((prev) => ({ ...prev, [c.id]: c }));
      setSelectedId(c.id);
      onDashboardChange(await api.dashboard());
    } catch (err) {
      setError(message(err, "Something went wrong. Please try again."));
    } finally {
      setRunning(false);
    }
  }, [onDashboardChange, sections]);

  const download = useCallback(
    async (format: DownloadFormat, what: "resume" | "cover-letter" = "resume") => {
      if (!customization) return;
      setDownloading(`${what}:${format}`);
      setError(null);
      try {
        if (what === "resume") await api.downloadCustomization(customization.id, format);
        else await api.downloadCoverLetter(customization.id, format);
      } catch (err) {
        setError(message(err, "Download failed. Try again."));
      } finally {
        setDownloading(null);
      }
    },
    [customization],
  );

  /** Stream a cover letter for the shown version; the text appears as the AI writes it. */
  const generateCoverLetter = useCallback(async () => {
    if (!customization) return;
    const id = customization.id;
    setCoverError(null);
    setCoverStream({ id, text: "" });
    try {
      await api.streamCoverLetter(id, (text) => setCoverStream({ id, text }));
      const saved = await api.getCustomization(id);
      setCache((prev) => ({ ...prev, [id]: saved }));
      setVersions((prev) => ({
        ...prev,
        [saved.source]: prev[saved.source]?.map((v) => (v.id === id ? { ...v, has_cover_letter: true } : v)),
      }));
      setCoverStream(null);
    } catch (err) {
      setCoverError(message(err, "Couldn't write the cover letter. Please try again."));
      setCoverStream(null);
    }
  }, [customization]);

  const loadVersion = useCallback(
    (id: string) => {
      if (!cache[id]) void api.getCustomization(id).then((c) => setCache((prev) => ({ ...prev, [c.id]: c })));
    },
    [cache],
  );

  return {
    customization,
    versions: sourceVersions,
    selectVersion: setSelectedId,
    getVersion: (id: string) => cache[id] ?? null,
    loadVersion,
    sections,
    setSections,
    loadingLatest,
    running,
    progress,
    error,
    setError,
    downloading,
    run,
    download,
    coverStream: coverStream && coverStream.id === customization?.id ? coverStream.text : null,
    coverError,
    generateCoverLetter,
  };
}

export type CustomizationState = ReturnType<typeof useCustomization>;
