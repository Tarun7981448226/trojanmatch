# Trojan JobMatch

Every Trojan deserves the right match. Trojan JobMatch is an AI job and resume helper for USC students.

Live: https://trojanmatch.tarundeepreddy.com

> **Prior-work note:** this is the pre-event prototype, built before the AI@USC
> Hackathon (Nov 14–15, 2026) on top of my own earlier project. It is shared with the
> organizers' approval. Work done during the hackathon is added in later commits.

## What it does
- **Accounts:** sign up or log in, hashed passwords, password reset by email.
- **Resume:** upload a PDF. The AI Resume Reader pulls out your skills, education and projects. Each resume is private to its owner.
- **Jobs:** a shared job feed with domain, company and job-type filters, plus your own Saved / Applied / Not interested lists.
- **Analyze with AI:** a fit score, eligibility, strengths, gaps and next steps for any job, compared against your resume.
- **JobMatch Agent:** a chat where the agents (Scout, Resume Reader, Analyst, Tracker) search, analyze and save jobs. It never applies for you.
- **Resume builder:** 10 layouts inspired by popular Overleaf templates, AI-prefilled from your resume. "Improve with AI" never adds facts, and the summary is written last. Downloads as a PDF.

## Tech
Next.js (App Router), Tailwind, Neon Postgres (serverless driver), Gemini (gemini-flash-lite-latest), jose JWT sessions, bcrypt, nodemailer, unpdf. Deployed on Vercel.

## Run locally
```bash
npm install
./scripts/setup_db.sh      # creates the tables (scripts/schema.sql) and writes .env.local
./scripts/set_gemini.sh    # Gemini API key for the AI agents
./scripts/set_mail.sh      # optional: Gmail app password for reset emails
npm run dev
```
After loading job postings into `jobs`, run `npx tsx --env-file=.env.local scripts/classify_jobs.ts` to tag their domain, level and job type.

Secrets belong only in `.env.local` or in Vercel's environment settings. Never commit them.

## Project layout
- `app/`: pages and API routes (`api/agent`, `api/resume`, `api/dashboard`, `api/auth`)
- `components/`: dashboard, resume builder and auth UI
- `lib/ai/`: Gemini client and the agents (Resume Reader, Analyst, agent tools)
- `lib/resume/`: resume builder data and the 10 layouts
- `scripts/`: database schema and setup helpers
