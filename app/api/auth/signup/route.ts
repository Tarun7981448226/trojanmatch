import { NextRequest, NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth/password";
import { normalizeEmail, normalizePhone, normalizeSkills, passwordProblem, startSession } from "@/lib/auth/users";
import { getSql } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";
  const email = normalizeEmail(body?.email);
  const phone = normalizePhone(body?.phone);
  const problem = passwordProblem(body?.password);

  if (!name) return NextResponse.json({ error: "Please enter your name" }, { status: 400 });
  if (!email) return NextResponse.json({ error: "Please enter a valid email" }, { status: 400 });
  if (phone === undefined) {
    return NextResponse.json({ error: "Phone number should be 7 to 15 digits, e.g. +12135551234" }, { status: 400 });
  }
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const passwordHash = await hashPassword(body.password);
  const rows = (await getSql()`
    insert into tm_users (email, name, phone, password_hash, skills)
    values (${email}, ${name}, ${phone}, ${passwordHash}, ${normalizeSkills(body?.skills)})
    on conflict (email) do nothing
    returning id
  `) as { id: number }[];
  if (rows.length === 0) {
    return NextResponse.json({ error: "An account with this email already exists. Try logging in." }, { status: 409 });
  }

  await startSession(rows[0].id, true);
  return NextResponse.json({ ok: true });
}
