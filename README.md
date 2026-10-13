# Resume Customizer — Frontend

Next.js frontend for the AI Resume Customizer. Users sign up, upload a resume (or enter their details manually), paste a job description, and get a tailored resume, ATS check, change diff and cover letter, downloadable as PDF, DOCX or TXT.

Backend: FastAPI + MongoDB + Groq (separate repository).

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS 4**, with light and dark mode
- **react-hook-form** + **zod** for form validation
- **libphonenumber-js** for phone validation with country codes
- **jsdiff** (`diff`) for the word-level diff view

## Features

- **Auth:** signup and login with password rules; the session uses HttpOnly cookies with automatic token refresh
- **Step 1, about you:** upload a PDF/DOCX resume (name and size shown) **or** fill in details manually (experience, projects, skills, education). The tab you choose is what the AI uses.
- **Step 2, job description:** text area with validation (non-empty, minimum length)
- **Step 3, AI customization:**
  - Section-wise tailoring: choose Summary, Skills, Experience or Projects
  - Job match score (before → after) and a rule-based **ATS score** with a checklist
  - **Tailored resume** preview, plus downloads as PDF, DOCX or TXT
  - **Changes:** highlighted diff against your original, or against another version
  - **Improvements:** matched and missing keywords, suggestions, bullet changes
  - **Versions:** every generation is saved, and you can switch between them
  - **Cover letter:** streamed live as the AI writes it; copy or download it
- Clear error messages for invalid files, large files, empty input and AI failures

## Project structure

```
frontend/
├── src/
│   ├── app/                 # Pages: / (dashboard), /login, /signup
│   ├── components/
│   │   ├── dashboard/       # Profile, job description and customize steps, diff, ATS, cover letter…
│   │   └── ui.tsx           # Shared buttons, inputs, alerts
│   ├── lib/
│   │   ├── api.ts           # Typed API client (cookie auth, token refresh, downloads, streaming)
│   │   ├── useCustomization.ts
│   │   └── validation.ts    # zod schemas
│   └── proxy.ts             # Redirects signed-out visitors to /login
├── next.config.ts           # Proxies /api/* to the backend
└── .env.example
```

## How it talks to the backend

The browser only calls this Next.js app. `next.config.ts` rewrites `/api/*` to the FastAPI backend (`BACKEND_URL`). This keeps the auth cookies first-party and avoids CORS. The proxy timeout is raised to 180 s because AI customization can take 30 s or more.

## Setup

Requires **Node.js 20+** and the backend running (default: `http://localhost:8000`).

```bash
cd frontend
npm install
cp .env.example .env.local   # optional locally; defaults to http://localhost:8000
npm run dev -- -p 3001
```

Open http://localhost:3001.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `BACKEND_URL` | `http://localhost:8000` | URL of the FastAPI backend that `/api/*` is proxied to |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (includes the type check) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## Deployment (Vercel)

1. Import this repository in Vercel. The framework preset is Next.js and needs no build settings.
2. Add the environment variable `BACKEND_URL` = your deployed backend URL (e.g. `https://your-backend.onrender.com`), without a trailing slash.
3. Deploy. Then set the backend's `FRONTEND_URL` to your Vercel URL.
