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
cp .env.local.example .env.local   # fill in DATABASE_URL, SESSION_SECRET, GEMINI_API_KEY, SMTP_*
npm run dev
```
Secrets belong only in `.env.local` or in Vercel's environment settings. Never commit them.
