import { NextRequest, NextResponse } from "next/server";

import { GeminiError, geminiJSON } from "@/lib/ai/gemini";
import { requireSession } from "@/lib/auth/session";
import { normalizeResume } from "@/lib/resume/types";

export const maxDuration = 30;

// Resume Coach writes the summary LAST, after reading the whole resume.
// The opening and closing lines matter most, so the prompt pins them down.
export async function POST(request: NextRequest) {
  if (!(await requireSession(request))) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const data = normalizeResume(body?.data);
  const target = typeof body?.target === "string" ? body.target.slice(0, 120) : "";
  const { summary: _old, ...rest } = data;
  void _old;
  if (!rest.education.some((e) => e.school) && !rest.experience.some((e) => e.title) && !rest.projects.some((p) => p.name)) {
    return NextResponse.json({ error: "Fill in your education, experience or projects first. The summary is written from them." }, { status: 400 });
  }
  try {
    const out = await geminiJSON<{ summary: string }>(`You are the Resume Coach agent. Read this whole resume, then write its professional summary.
Rules:
- 2 or 3 sentences, 45 to 65 words total, no first person ("I"), no buzzword filler.
- OPENING sentence (most important): who the candidate is: degree and school, plus their strongest focus area and 2-3 of their strongest skills from the resume.
- MIDDLE (optional): one concrete highlight taken from their experience or projects, keeping any number exactly as written.
- CLOSING sentence (most important): the value they bring and the kind of role they are seeking${target ? ` (target: ${target})` : ""}.
- Use only facts present in the resume. Never invent skills, numbers, employers or results.
Return JSON {"summary": string}.

RESUME
${JSON.stringify(rest)}`);
    return NextResponse.json({ summary: String(out.summary ?? "").trim() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof GeminiError ? error.message : "Couldn't write the summary. Try again." }, { status: 502 });
  }
}
