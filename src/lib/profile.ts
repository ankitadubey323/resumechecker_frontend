// Dashboard form rules. The backend (backend/app/dashboard_schemas.py) enforces
// the same rules again; these exist only to give instant feedback.
import { z } from "zod";

import type { ProfileDetails } from "@/lib/api";

export const MIN_SKILLS = 3;
export const JD_MIN = 100;
export const JD_MAX = 20_000;
export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_MAX_BYTES = 2 * 1024 * 1024;

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const thisMonth = () => new Date().toISOString().slice(0, 7);

const experienceSchema = z
  .object({
    company: z.string().trim().min(1, "Company is required").max(100),
    role: z.string().trim().min(1, "Role is required").max(100),
    start: z.string().regex(MONTH_RE, "Pick a start month"),
    current: z.boolean(),
    end: z.string(),
    description: z.string().max(1500, "Keep it under 1500 characters"),
  })
  .superRefine((v, ctx) => {
    if (MONTH_RE.test(v.start) && v.start > thisMonth()) {
      ctx.addIssue({ code: "custom", path: ["start"], message: "Start can't be in the future" });
    }
    if (!v.current) {
      if (!MONTH_RE.test(v.end)) ctx.addIssue({ code: "custom", path: ["end"], message: "Pick an end month" });
      else if (v.end < v.start) ctx.addIssue({ code: "custom", path: ["end"], message: "End must be after start" });
      else if (v.end > thisMonth()) ctx.addIssue({ code: "custom", path: ["end"], message: "End can't be in the future" });
    }
  });

const projectSchema = z.object({
  title: z.string().trim().min(1, "Project title is required").max(100),
  description: z.string().max(1500, "Keep it under 1500 characters"),
  tech: z.array(z.string()).max(20, "Up to 20 technologies"),
  link: z
    .string()
    .trim()
    .refine((v) => v === "" || /^https?:\/\/[^\s]+\.[^\s]+$/i.test(v), "Enter a full link starting with https://"),
});

const educationSchema = z.object({
  degree: z.string().trim().min(1, "Degree is required").max(100),
  institution: z.string().trim().min(1, "Institution is required").max(150),
  year: z
    .string()
    .refine((v) => v === "" || (/^\d{4}$/.test(v) && +v >= 1950 && +v <= new Date().getFullYear() + 6), "Enter a valid year"),
});

export const detailsSchema = z
  .object({
    // includes() rather than ===, so TS doesn't infer a type predicate and narrow the form type ("" is the initial value).
    experience_level: z.string().refine((v) => ["fresher", "experienced"].includes(v), "Choose fresher or experienced"),
    headline: z.string().trim().min(2, "Add a short headline, e.g. “Frontend Developer”").max(120),
    years_experience: z.string(),
    skills: z.array(z.string()).max(50, "Up to 50 skills"),
    experiences: z.array(experienceSchema).max(20),
    projects: z.array(projectSchema).max(20),
    education: z.array(educationSchema).max(10),
  })
  .superRefine((v, ctx) => {
    if (v.experience_level === "experienced") {
      const years = Number(v.years_experience);
      if (!v.years_experience || !Number.isFinite(years) || years <= 0 || years > 50) {
        ctx.addIssue({ code: "custom", path: ["years_experience"], message: "Enter years of experience (0.5–50)" });
      }
      if (v.experiences.length === 0) {
        ctx.addIssue({ code: "custom", path: ["experiences"], message: "Add at least one work experience" });
      }
    }
    if (v.experience_level === "fresher" && v.education.length === 0) {
      ctx.addIssue({ code: "custom", path: ["education"], message: "Add your education" });
    }
    if (new Set(v.skills.map((s) => s.toLowerCase())).size < MIN_SKILLS) {
      ctx.addIssue({ code: "custom", path: ["skills"], message: `Add at least ${MIN_SKILLS} skills` });
    }
    if (v.projects.length === 0) {
      ctx.addIssue({ code: "custom", path: ["projects"], message: "Add at least one project" });
    }
  });

export type DetailsForm = z.infer<typeof detailsSchema>;

export const emptyExperience = (): DetailsForm["experiences"][number] => ({
  company: "",
  role: "",
  start: "",
  current: false,
  end: "",
  description: "",
});
export const emptyProject = (): DetailsForm["projects"][number] => ({ title: "", description: "", tech: [], link: "" });
export const emptyEducation = (): DetailsForm["education"][number] => ({ degree: "", institution: "", year: "" });

export function detailsToForm(d: ProfileDetails | null): DetailsForm {
  if (!d) {
    return {
      experience_level: "",
      headline: "",
      years_experience: "",
      skills: [],
      experiences: [],
      projects: [emptyProject()],
      education: [],
    };
  }
  return {
    experience_level: d.experience_level,
    headline: d.headline,
    years_experience: d.years_experience ? String(d.years_experience) : "",
    skills: d.skills,
    experiences: d.experiences.map((e) => ({ ...e, current: e.end === null, end: e.end ?? "" })),
    projects: d.projects.map((p) => ({ ...p, link: p.link ?? "" })),
    education: d.education.map((e) => ({ ...e, year: e.year ? String(e.year) : "" })),
  };
}

export function formToDetails(f: DetailsForm): ProfileDetails {
  const experienced = f.experience_level === "experienced";
  return {
    experience_level: f.experience_level as ProfileDetails["experience_level"],
    headline: f.headline.trim(),
    years_experience: experienced ? Number(f.years_experience) : 0,
    skills: f.skills,
    // Freshers can still list internships; keep whatever they entered.
    experiences: f.experiences.map(({ current, end, ...e }) => ({ ...e, end: current ? null : end })),
    projects: f.projects.map((p) => ({ ...p, link: p.link.trim() || null })),
    education: f.education.map((e) => ({ ...e, year: e.year ? Number(e.year) : null })),
  };
}

/** Returns an error message, or null if the file looks acceptable. */
export function checkResumeFile(file: File): string | null {
  const ext = file.name.toLowerCase().split(".").pop();
  if (ext !== "pdf" && ext !== "docx") return "Only PDF or DOCX files are supported.";
  if (file.size === 0) return "The file is empty.";
  if (file.size > RESUME_MAX_BYTES) return "The file is larger than 5 MB.";
  return null;
}

export function checkPhotoFile(file: File): string | null {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "Upload a JPG, PNG or WebP image.";
  if (file.size > PHOTO_MAX_BYTES) return "Photos must be 2 MB or smaller.";
  return null;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function timeAgo(iso: string): string {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "just now";
}
