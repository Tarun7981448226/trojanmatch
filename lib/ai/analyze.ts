import { GeminiError, geminiJSON } from "@/lib/ai/gemini";
import { loadResume } from "@/lib/ai/resume";
import { getSql } from "@/lib/db";

export interface Analysis {
  fit: number;
  verdict: string;
  eligible: "yes" | "no" | "unclear";
  eligibility_reason: string;
  strengths: string[];
  gaps: string[];
  next_steps: string[];
  jd_used: boolean;
}

interface JobRow {
  id: number;
  company: string;
  role: string;
  location: string | null;
  skills: unknown;
  keywords: unknown;
  visa_notes: string | null;
  type: string | null;
  jd_text: string | null;
}

export class NoResumeError extends Error {}

// Analyst agent: one user's resume vs one job. Cached per (user, job);
// a new resume upload clears that user's cache.
export async function analyzeJob(userId: number, jobId: number): Promise<{ analysis: Analysis; cached: boolean; job: JobRow }> {
  const sql = getSql();
  const jobs = (await sql`
    select id, company, role, location, skills, keywords, visa_notes, type, jd_text from jobs where id = ${jobId}
  `) as JobRow[];
  const job = jobs[0];
  if (!job) throw new GeminiError("That job no longer exists.");

  const cached = (await sql`select result from tm_analyses where user_id = ${userId} and job_id = ${jobId}`) as { result: Analysis }[];
  if (cached[0]) return { analysis: cached[0].result, cached: true, job };

  const resume = await loadResume(userId);
  if (!resume) throw new NoResumeError("Upload your resume first so the Analyst can compare it with this job.");

  const jd = (job.jd_text ?? "").trim();
  const prompt = `You are the Analyst agent of Trojan JobMatch, helping a USC student decide whether to apply.
Compare the student's resume with the job and answer honestly. Return JSON:
{"fit": integer 0-100, "verdict": "one short sentence",
 "eligible": "yes" | "no" | "unclear",
 "eligibility_reason": "one sentence: degree level, graduation timing, location or work-authorization wording in the job; 'unclear' when the posting doesn't say",
 "strengths": [up to 4 short points, each naming something that is actually in the resume],
 "gaps": [up to 4 short points: requirements the resume does not show],
 "next_steps": [up to 3 concrete actions the student can take to get closer, e.g. a project or skill to learn]}
Rules: never claim the student has a skill or experience that is not in the resume. If only the job title is known, say so in the verdict and keep the fit estimate cautious.

JOB
Company: ${job.company}
Title: ${job.role}
Location: ${job.location ?? "not stated"}
Type: ${job.type ?? "not stated"}
Listed skills: ${JSON.stringify(job.skills ?? [])}
Keywords: ${JSON.stringify(job.keywords ?? [])}
Visa notes: ${job.visa_notes ?? "none"}
Description: ${jd ? jd.slice(0, 12000) : "(no full description available, only the title and listed skills)"}

STUDENT RESUME
${resume.text.slice(0, 15000)}`;

  const raw = await geminiJSON<Partial<Analysis>>(prompt);
  const analysis: Analysis = {
    fit: Math.max(0, Math.min(100, Math.round(Number(raw.fit) || 0))),
    verdict: String(raw.verdict ?? ""),
    eligible: raw.eligible === "yes" || raw.eligible === "no" ? raw.eligible : "unclear",
    eligibility_reason: String(raw.eligibility_reason ?? ""),
    strengths: (raw.strengths ?? []).map(String).slice(0, 4),
    gaps: (raw.gaps ?? []).map(String).slice(0, 4),
    next_steps: (raw.next_steps ?? []).map(String).slice(0, 3),
    jd_used: jd.length > 200,
  };
  await sql`
    insert into tm_analyses (user_id, job_id, result) values (${userId}, ${jobId}, ${JSON.stringify(analysis)})
    on conflict (user_id, job_id) do update set result = excluded.result, created_at = now()
  `;
  return { analysis, cached: false, job };
}
