import { NextRequest, NextResponse } from "next/server";

import { GeminiError, geminiJSON } from "@/lib/ai/gemini";
import { loadResume } from "@/lib/ai/resume";
import { requireSession } from "@/lib/auth/session";
import { findUserById } from "@/lib/auth/users";
import { getSql } from "@/lib/db";
import { emptyResume, isResumeStyle, normalizeResume, type ResumeData } from "@/lib/resume/types";

export const maxDuration = 60;

const FILL_PROMPT = `Convert this resume text into JSON for a resume builder. Copy facts exactly; never invent anything.
Shape: {"name","email","phone","location" (city, state),"linkedin","github","website","summary",
"education":[{"school","degree","location","start","end","gpa","coursework"}],
"experience":[{"title","company","location","start","end","bullets": "one bullet per line"}],
"projects":[{"name","tech","link","dates","bullets": "one bullet per line"}],
"skills":[{"category","items": "comma separated"}]}
Use "" for anything the resume doesn't state.`;

// GET: the user's saved draft; if none, one pre-filled from their own
// uploaded resume (AI, facts only); if no resume, an empty form with
// their account name and email.
export async function GET(request: NextRequest) {
  const userId = await requireSession(request);
  const user = userId ? await findUserById(userId) : null;
  if (!userId || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const sql = getSql();
  const saved = (await sql`select style, data from tm_resume_drafts where user_id = ${userId}`) as { style: string; data: unknown }[];
  if (saved[0] && request.nextUrl.searchParams.get("fresh") !== "1") {
    return NextResponse.json({ style: isResumeStyle(saved[0].style) ? saved[0].style : "jake", data: normalizeResume(saved[0].data), source: "saved" });
  }
  const resume = await loadResume(userId);
  if (resume) {
    try {
      const filled = await geminiJSON<ResumeData>(`${FILL_PROMPT}\n\nRESUME TEXT\n${resume.text.slice(0, 20000)}`);
      return NextResponse.json({ style: "jake", data: normalizeResume(filled), source: "resume" });
    } catch (error) {
      if (!(error instanceof GeminiError)) throw error;
    }
  }
  return NextResponse.json({ style: "jake", data: { ...emptyResume(), name: user.name, email: user.email }, source: "empty" });
}

// POST: save the draft (only ever the signed-in user's own row).
export async function POST(request: NextRequest) {
  const userId = await requireSession(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const style = isResumeStyle(body?.style) ? body.style : "jake";
  const data = normalizeResume(body?.data);
  await getSql()`
    insert into tm_resume_drafts (user_id, style, data) values (${userId}, ${style}, ${JSON.stringify(data)})
    on conflict (user_id) do update set style = excluded.style, data = excluded.data, updated_at = now()
  `;
  return NextResponse.json({ ok: true });
}
