import { NextRequest, NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";

import { GeminiError, geminiJSON } from "@/lib/ai/gemini";
import { loadResume, type ResumeProfile } from "@/lib/ai/resume";
import { requireSession } from "@/lib/auth/session";
import { normalizeSkills } from "@/lib/auth/users";
import { getSql } from "@/lib/db";

export const maxDuration = 60;
const MAX_BYTES = 4 * 1024 * 1024;

const PARSE_PROMPT = `You are the Resume Reader agent for Trojan JobMatch, a job helper for USC students.
Read the resume text below and return JSON with exactly these keys:
{"profile": {"name": str, "school": str, "degree": str, "grad_date": str,
  "work_authorization": str (only if the resume states it, else ""),
  "skills": [up to 40 short lower-case skills, tools, languages and frameworks that appear in the resume],
  "experience": [{"title": str, "org": str, "dates": str, "highlights": [str]}],
  "projects": [{"name": str, "tech": [str], "highlights": [str]}],
  "summary": "two sentences describing the candidate, using only facts in the resume"}}
Only use what is written in the resume. Never invent skills, employers, dates or numbers.`;

// The signed-in user's own resume only. No route accepts a user id from
// the client, so one person can never read or overwrite another's resume.
export async function GET(request: NextRequest) {
  const userId = await requireSession(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const resume = await loadResume(userId);
  return NextResponse.json({ resume: resume && { file_name: resume.file_name, profile: resume.profile, uploaded_at: resume.uploaded_at } });
}

export async function POST(request: NextRequest) {
  const userId = await requireSession(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a PDF to upload" }, { status: 400 });
  if (file.type !== "application/pdf") return NextResponse.json({ error: "Please upload your resume as a PDF" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "That PDF is over 4 MB" }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  // Text comes straight from the PDF (instant); the AI only builds the profile.
  let text = "";
  try {
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    text = (await extractText(pdf, { mergePages: true })).text.trim();
    // Clickable links (LinkedIn, GitHub, portfolio) aren't in the text layer.
    const links = new Set<string>();
    for (let n = 1; n <= Math.min(pdf.numPages, 4); n++) {
      const annots = await (await pdf.getPage(n)).getAnnotations();
      for (const a of annots as { url?: string }[]) if (a.url && !a.url.startsWith("mailto:")) links.add(a.url);
    }
    if (links.size) text += `\n\nLinks in this resume: ${[...links].join(" , ")}`;
  } catch {
    return NextResponse.json({ error: "Couldn't open that PDF. Try exporting it again." }, { status: 400 });
  }
  if (text.length < 200) {
    return NextResponse.json({ error: "That PDF has no readable text (is it a scanned image?). Upload a text PDF." }, { status: 400 });
  }
  let parsed: { profile: ResumeProfile };
  try {
    parsed = await geminiJSON(`${PARSE_PROMPT}\n\nRESUME TEXT\n${text.slice(0, 20000)}`);
  } catch (error) {
    const message = error instanceof GeminiError ? error.message : "Couldn't read that resume. Try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
  const profile = parsed.profile ?? {};
  const skills = normalizeSkills(profile.skills ?? []);
  profile.skills = skills;
  const name = file.name.slice(0, 120);

  const sql = getSql();
  await sql`
    insert into tm_resumes (user_id, file_name, mime, file, text, profile, uploaded_at)
    values (${userId}, ${name}, ${file.type}, ${"\\x" + bytes.toString("hex")}, ${text.slice(0, 60000)}, ${JSON.stringify(profile)}, now())
    on conflict (user_id) do update set file_name = excluded.file_name, mime = excluded.mime, file = excluded.file,
      text = excluded.text, profile = excluded.profile, uploaded_at = now()
  `;
  // New resume = old AI analyses are stale.
  await sql`delete from tm_analyses where user_id = ${userId}`;
  if (skills.length > 0) await sql`update tm_users set skills = ${skills} where id = ${userId}`;
  return NextResponse.json({ resume: { file_name: name, profile }, skills });
}

export async function DELETE(request: NextRequest) {
  const userId = await requireSession(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const sql = getSql();
  await sql`delete from tm_resumes where user_id = ${userId}`;
  await sql`delete from tm_analyses where user_id = ${userId}`;
  await sql`update tm_users set skills = '{}' where id = ${userId}`;
  return NextResponse.json({ ok: true });
}
