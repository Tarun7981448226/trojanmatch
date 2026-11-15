import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { GeminiError } from "@/lib/ai/gemini";
import { requireSession } from "@/lib/auth/session";
import { injectionLines, runAnalyst, runDebate, runJudge, runReviewer } from "@/lib/check/agents";
import { byteaToBytes, readPdf } from "@/lib/check/extract";
import { runDeterministic } from "@/lib/check";
import { JobTextError, jobTextFrom } from "@/lib/check/jobText";
import { getSql } from "@/lib/db";

export const maxDuration = 60;
const PROMPT_VERSION = "check-v4";

// POST: run a recruiter-style check of the signed-in student's own resume
// against a pasted job, streaming each stage as one JSON line (NDJSON).
export async function POST(request: NextRequest) {
  const userId = await requireSession(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const body = await request.json().catch(() => ({}));

  const role = typeof body?.role === "string" ? body.role.trim().slice(0, 80) : "";
  let jobText: string;
  try {
    jobText = await jobTextFrom(body ?? {});
    // No job post: recruiters still screen against a role, so describe a typical one.
    if (!jobText) {
      jobText = `GENERAL RESUME EVALUATION (no specific job post). Evaluate this resume the way a university recruiter screens applicants for ${role ? `"${role}" roles` : "the internship and new-grad roles that best fit the student's degree and experience"}. Use the typical expectations for those roles as the requirements.`;
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof JobTextError ? error.message : "Couldn't read that job." }, { status: 400 });
  }
  const sql = getSql();
  const rows = (await sql`select file, text from tm_resumes where user_id = ${userId}`) as { file: unknown; text: string }[];
  if (!rows[0]) return NextResponse.json({ error: "No resume added yet. Upload your resume on the dashboard first.", needResume: true }, { status: 400 });

  const pdf = await readPdf(byteaToBytes(rows[0].file)).catch(() => null);
  if (!pdf || pdf.text.length < 100) return NextResponse.json({ error: "Couldn't read your resume PDF. Try uploading it again." }, { status: 400 });

  const cacheKey = createHash("sha256").update(`${PROMPT_VERSION}\n${pdf.text}\n${jobText.replace(/\s+/g, " ").trim()}`).digest("hex");
  const cached = (await sql`select id, analysis from tm_checks where user_id = ${userId} and cache_key = ${cacheKey} and analysis ? 'judge' order by created_at desc limit 1`) as { id: number; analysis: Record<string, unknown> }[];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (stage: string, data: unknown) => controller.enqueue(encoder.encode(JSON.stringify({ stage, data }) + "\n"));
      try {
        if (cached[0]) {
          const a = cached[0].analysis;
          for (const stage of ["deterministic", "analyst", "reviewer", "debate", "judge"]) if (a[stage]) send(stage, a[stage]);
          send("done", { id: cached[0].id, cached: true });
          return controller.close();
        }
        const report = runDeterministic(pdf, jobText);
        const injection = injectionLines(jobText);
        send("deterministic", { ...report, injection, meta: pdf.meta });

        // The Career Fair Reviewer only needs the resume, so it runs alongside the Analyst.
        const reviewerP = runReviewer(report).then((r) => (send("reviewer", r), r)).catch(() => null);
        const analyst = await runAnalyst(report, jobText);
        send("analyst", analyst);
        // If Google is busy for the debate, keep going: the Judge rules on the evidence alone.
        const debate = await runDebate(report, analyst, jobText).catch(() => ({ recruiter: { score: 0, claims: [] }, advocate: { score: 0, claims: [] } }));
        send("debate", debate);
        const reviewer = await reviewerP;
        const judge = await runJudge(report, analyst, debate, reviewer);
        send("judge", judge);

        const analysis = { deterministic: { ...report, injection, meta: pdf.meta }, analyst, reviewer, debate, judge };
        const saved = (await sql`
          insert into tm_checks (user_id, title, company, job_text, analysis, cache_key)
          values (${userId}, ${analyst.title}, ${analyst.company}, ${jobText}, ${JSON.stringify(analysis)}, ${cacheKey})
          returning id
        `) as { id: number }[];
        send("done", { id: saved[0].id, cached: false });
      } catch (error) {
        send("error", { message: error instanceof GeminiError ? error.message : "The check hit a problem. Try again." });
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}

// GET: the student's own past checks.
export async function GET(request: NextRequest) {
  const userId = await requireSession(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const rows = await getSql()`
    select id, title, company, created_at, analysis->'judge'->>'verdict' as verdict, (analysis->'judge'->>'score')::int as score
    from tm_checks where user_id = ${userId} order by created_at desc limit 30
  `;
  return NextResponse.json({ checks: rows });
}
