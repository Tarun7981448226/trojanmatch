import { NextRequest, NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { getSql } from "@/lib/db";

// One saved check: only its owner can read or delete it.
async function owned(request: NextRequest, params: Promise<{ id: string }>) {
  const userId = await requireSession(request);
  const id = Number((await params).id);
  return { userId, id: Number.isInteger(id) && id > 0 ? id : null };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, id } = await owned(request, params);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const rows = (await getSql()`
    select id, title, company, job_text, analysis, questions, answers, tailored, created_at
    from tm_checks where id = ${id} and user_id = ${userId}
  `) as Record<string, unknown>[];
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ check: rows[0] });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, id } = await owned(request, params);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (id) await getSql()`delete from tm_checks where id = ${id} and user_id = ${userId}`;
  return NextResponse.json({ ok: true });
}
