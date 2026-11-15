import { createHash } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth/password";
import { passwordProblem, startSession } from "@/lib/auth/users";
import { getSql } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const problem = passwordProblem(body?.password);
  if (!token) return NextResponse.json({ error: "This reset link is invalid" }, { status: 400 });
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const sql = getSql();
  // Claim the link atomically: it works once and only before it expires.
  const claimed = (await sql`
    update tm_password_resets set used_at = now()
    where token_hash = ${tokenHash} and used_at is null and expires_at > now()
    returning user_id
  `) as { user_id: number }[];
  if (claimed.length === 0) {
    return NextResponse.json({ error: "This reset link has expired or was already used" }, { status: 400 });
  }

  const userId = Number(claimed[0].user_id);
  await sql`update tm_users set password_hash = ${await hashPassword(body.password)} where id = ${userId}`;
  await startSession(userId, false);
  return NextResponse.json({ ok: true });
}
