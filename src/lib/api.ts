export type User = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
};

export type WorkExperience = { company: string; role: string; start: string; end: string | null; description: string };
export type Project = { title: string; description: string; tech: string[]; link: string | null };
export type Education = { degree: string; institution: string; year: number | null };

export type ProfileDetails = {
  experience_level: "fresher" | "experienced";
  headline: string;
  years_experience: number;
  skills: string[];
  experiences: WorkExperience[];
  projects: Project[];
  education: Education[];
};

export type Dashboard = {
  user: User;
  details: ProfileDetails | null;
  details_updated_at: string | null;
  photo_version: number | null;
  resume: {
    filename: string;
    size: number;
    page_count: number | null;
    word_count: number;
    preview: string;
    uploaded_at: string;
  } | null;
  latest_job_description: { id: string; text: string; preview: string; length: number; created_at: string } | null;
  completion: { percent: number; missing: string[] };
  ready_for_job_description: boolean;
  ready_for_customization: boolean;
  customization_input: "resume" | "details" | null; // what the AI will use: the most recent input
  latest_customization: { id: string; created_at: string; outdated: boolean } | null;
};

// Mirrors backend/app/llm/schemas.py
export type TailoredResume = {
  name: string;
  headline: string;
  contact: { email: string; phone: string; location: string | null; links: string[] };
  summary: string;
  skills: { category: string; items: string[] }[];
  experience: { title: string; company: string; location: string | null; start: string; end: string; bullets: string[] }[];
  projects: { name: string; tech: string[]; link: string | null; bullets: string[] }[];
  education: { degree: string; institution: string; year: string | null; details: string | null }[];
  certifications: string[];
};

export type Priority = "high" | "medium" | "low";

export type Analysis = {
  jd_requirements: string[];
  matched_keywords: string[];
  missing_keywords: string[];
  bullet_changes: { section: string; original: string; improved: string; reason: string }[];
  suggestions: { area: string; priority: Priority; suggestion: string }[];
  match_score_before: number;
  match_score_after: number;
  score_explanation: string;
};

export type Section = "summary" | "skills" | "experience" | "projects";
export const ALL_SECTIONS: Section[] = ["summary", "skills", "experience", "projects"];

export type AtsReport = {
  score: number;
  checks: { label: string; passed: boolean; detail: string; points: number; max_points: number }[];
};

export type Customization = {
  id: string;
  created_at: string;
  model: string;
  source: "resume" | "details"; // which input the result was based on
  sections: Section[]; // which sections the AI was allowed to rewrite
  job_description_preview: string;
  outdated: boolean;
  warnings: string[];
  result: { resume: TailoredResume; analysis: Analysis };
  ats: AtsReport;
  input_text: string | null; // what was sent to the AI (null for older versions)
  tailored_text: string; // the tailored resume as plain text
  cover_letter: { text: string; created_at: string } | null;
};

export type VersionSummary = {
  id: string;
  created_at: string;
  source: "resume" | "details";
  sections: Section[];
  match_score_after: number;
  ats_score: number;
  has_cover_letter: boolean;
};

// Appended to a cover-letter stream if the AI fails mid-way (see backend STREAM_ERROR_MARKER).
const STREAM_ERROR_MARKER = "\x1e";

export type DownloadFormat = "pdf" | "docx" | "txt";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors: Record<string, string> = {},
    readonly code?: string,
  ) {
    super(message);
  }
}

type Method = "GET" | "POST" | "PUT" | "DELETE";

// Auth endpoints that must not trigger a refresh-and-retry on 401.
const NO_REFRESH = ["/api/auth/login", "/api/auth/signup", "/api/auth/refresh", "/api/auth/logout"];

let refreshing: Promise<boolean> | null = null;

/** Exchange the refresh-token cookie for new tokens. Concurrent callers share one request,
 *  because each refresh token can only be used once. */
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch("/api/auth/refresh", { method: "POST", credentials: "same-origin", cache: "no-store" })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function send(path: string, init: { method?: Method; body?: unknown }): Promise<Response> {
  const isForm = init.body instanceof FormData;
  try {
    return await fetch(path, {
      method: init.method ?? (init.body ? "POST" : "GET"),
      // For FormData the browser sets the multipart Content-Type (with boundary) itself.
      headers: init.body && !isForm ? { "Content-Type": "application/json" } : undefined,
      body: isForm ? (init.body as FormData) : init.body ? JSON.stringify(init.body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }
}

async function sendWithRefresh(path: string, init: { method?: Method; body?: unknown }): Promise<Response> {
  let res = await send(path, init);
  if (res.status === 401 && !NO_REFRESH.includes(path)) {
    // Access token expired (15 min): get a new one and retry once. Retry even if the
    // refresh failed, in case another tab refreshed at the same moment.
    await refreshSession();
    res = await send(path, init);
  }
  return res;
}

async function toApiError(res: Response): Promise<ApiError> {
  // FastAPI sends detail as a string, or as {code, message} for some errors.
  const data = await res.json().catch(() => null);
  const detail = data?.detail;
  const message =
    typeof detail === "string"
      ? detail
      : detail?.message ?? (res.status >= 500 ? "Something went wrong on our side. Please try again." : "Request failed.");
  return new ApiError(message, res.status, data?.errors ?? {}, detail?.code);
}

async function request<T>(path: string, init: { method?: Method; body?: unknown } = {}): Promise<T> {
  const res = await sendWithRefresh(path, init);
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as T;
}

/** POST and read a plain-text streaming response, calling onChunk with the text so far. */
async function streamText(path: string, onText: (textSoFar: string) => void): Promise<string> {
  const res = await sendWithRefresh(path, { method: "POST" });
  if (!res.ok || !res.body) throw await toApiError(res);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    const marker = text.indexOf(STREAM_ERROR_MARKER);
    if (marker !== -1) throw new ApiError(text.slice(marker + 1) || "The AI stopped unexpectedly.", 502);
    onText(text);
  }
  return text;
}

/** Fetch a file from the API (with token refresh) and hand it to the browser as a download. */
async function download(path: string, fallbackName: string): Promise<void> {
  const res = await sendWithRefresh(path, {});
  if (!res.ok) throw await toApiError(res);
  const name = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function fileForm(file: File): FormData {
  const form = new FormData();
  form.append("file", file);
  return form;
}

type Message = { message: string };

export const api = {
  signup: (body: { full_name: string; email: string; phone: string; password: string; confirm_password: string }) =>
    request<User>("/api/auth/signup", { body }),
  login: (body: { email: string; password: string }) => request<User>("/api/auth/login", { body }),
  logout: () => request<Message>("/api/auth/logout", { method: "POST" }),
  me: () => request<User>("/api/auth/me"),

  dashboard: () => request<Dashboard>("/api/dashboard"),
  saveDetails: (body: ProfileDetails) => request<Dashboard>("/api/profile/details", { method: "PUT", body }),
  uploadPhoto: (file: File) => request<Dashboard>("/api/profile/photo", { body: fileForm(file) }),
  deletePhoto: () => request<Dashboard>("/api/profile/photo", { method: "DELETE" }),
  uploadResume: (file: File) => request<Dashboard>("/api/resume", { body: fileForm(file) }),
  deleteResume: () => request<Dashboard>("/api/resume", { method: "DELETE" }),
  submitJobDescription: (text: string) => request<Dashboard>("/api/job-descriptions", { body: { text } }),

  customize: (sections: Section[]) => request<Customization>("/api/customizations", { body: { sections } }),
  listVersions: (source: "resume" | "details") => request<VersionSummary[]>(`/api/customizations?source=${source}`),
  getCustomization: (id: string) => request<Customization>(`/api/customizations/${encodeURIComponent(id)}`),
  streamCoverLetter: (id: string, onText: (textSoFar: string) => void) =>
    streamText(`/api/customizations/${encodeURIComponent(id)}/cover-letter`, onText),
  downloadCoverLetter: (id: string, format: DownloadFormat) =>
    download(`/api/customizations/${encodeURIComponent(id)}/cover-letter/download?format=${format}`, `cover-letter.${format}`),
  latestCustomization: (source: "resume" | "details") =>
    request<Customization>(`/api/customizations/latest?source=${source}`),
  selectInput: (input: "resume" | "details") => request<Dashboard>("/api/profile/input", { method: "PUT", body: { input } }),
  downloadCustomization: (id: string, format: DownloadFormat) =>
    download(`/api/customizations/${encodeURIComponent(id)}/download?format=${format}`, `resume.${format}`),
};
