import { createHash, randomBytes } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { mailConfigured, sendResetEmail } from "@/lib/auth/mail";
import { findUserByEmail, normalizeEmail } from "@/lib/auth/users";
import { getSql } from "@/lib/db";

const RESET_MINUTES = 30;

// Always answers the same way whether or not the email has an account, so
// this form can't be used to find out who is signed up.
export async function POST(request: NextRequest) {
  if (!mailConfigured()) {
    return NextResponse.json({ ok: false, reason: "email-off" });
  }
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  if (!email) return NextResponse.json({ error: "Please enter a valid email" }, { status: 400 });

  const user = await findUserByEmail(email);
  if (user) {
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await getSql()`
      insert into tm_password_resets (token_hash, user_id, expires_at)
      values (${tokenHash}, ${user.id}, now() + make_interval(mins => ${RESET_MINUTES}))
    `;
    const link = `${request.nextUrl.origin}/reset?token=${token}`;
    try {
      await sendResetEmail(user.email, user.name, link);
    } catch {
      return NextResponse.json({ error: "Couldn't send the email right now. Try again in a minute." }, { status: 502 });
    }
  }
  return NextResponse.json({ ok: true });
}
