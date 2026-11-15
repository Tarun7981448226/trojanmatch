import { NextRequest, NextResponse } from "next/server";

import { GeminiError, geminiJSON } from "@/lib/ai/gemini";
import { requireSession } from "@/lib/auth/session";

export const maxDuration = 30;

// Resume Coach agent: rewrites the student's own bullets to read stronger.
// It may only rephrase; numbers, tools and claims must already be there.
export async function POST(request: NextRequest) {
  if (!(await requireSession(request))) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const bullets = typeof body?.bullets === "string" ? body.bullets.slice(0, 4000) : "";
  const context = typeof body?.context === "string" ? body.context.slice(0, 300) : "";
  if (!bullets.trim()) return NextResponse.json({ error: "Write a few bullet points first" }, { status: 400 });
  try {
    const out = await geminiJSON<{ bullets: string[] }>(`You are the Resume Coach agent for a USC student.
Rewrite these resume bullets for "${context}" so each starts with a strong action verb, is one line (under 25 words), and reads clearly for ATS.
Hard rules: keep every fact, number, tool and claim exactly as given; never add new numbers, tools, results, responsibilities, or quality words the student didn't write (e.g. 'securely', 'efficiently', 'scalable', 'critical'); only improve the verb, order and clarity; keep the same number of bullets.
Return JSON {"bullets": [string]}.

BULLETS
${bullets}`);
    const lines = (out.bullets ?? []).map((b) => String(b).replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
    return NextResponse.json({ bullets: lines.join("\n") });
  } catch (error) {
    return NextResponse.json({ error: error instanceof GeminiError ? error.message : "Couldn't improve that. Try again." }, { status: 502 });
  }
}
