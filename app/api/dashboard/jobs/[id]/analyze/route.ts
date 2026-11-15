import { NextRequest, NextResponse } from "next/server";

import { analyzeJob, NoResumeError } from "@/lib/ai/analyze";
import { GeminiError } from "@/lib/ai/gemini";
import { requireSession } from "@/lib/auth/session";

export const maxDuration = 60;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireSession(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const jobId = Number((await params).id);
  if (!Number.isInteger(jobId) || jobId <= 0) return NextResponse.json({ error: "Bad job id" }, { status: 400 });
  try {
    const { analysis, cached } = await analyzeJob(userId, jobId);
    return NextResponse.json({ analysis, cached });
  } catch (error) {
    if (error instanceof NoResumeError) return NextResponse.json({ error: error.message, needResume: true }, { status: 400 });
    const message = error instanceof GeminiError ? error.message : "Analysis failed. Try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
