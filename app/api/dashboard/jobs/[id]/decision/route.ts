import { NextRequest, NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { getSql } from "@/lib/db";

// Saves the signed-in user's own decision on a job (tm_decisions); null
// clears it. Other users' decisions and the shared jobs rows never change.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireSession(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const jobId = Number(id);
  if (!Number.isInteger(jobId)) return NextResponse.json({ error: "Invalid job id" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const decision = body.decision;
  if (decision !== null && !["saved", "applied", "not_interested"].includes(decision)) {
    return NextResponse.json({ error: 'decision must be "saved", "applied", "not_interested" or null' }, { status: 400 });
  }

  const sql = getSql();
  if (decision === null) {
    await sql`delete from tm_decisions where user_id = ${userId} and job_id = ${jobId}`;
    return NextResponse.json({ ok: true });
  }
  const rows = (await sql`
    insert into tm_decisions (user_id, job_id, decision)
    select ${userId}, id, ${decision} from jobs where id = ${jobId}
    on conflict (user_id, job_id) do update set decision = excluded.decision, updated_at = now()
    returning job_id
  `) as { job_id: number }[];
  if (rows.length === 0) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
