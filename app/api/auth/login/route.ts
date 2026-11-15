import { NextRequest, NextResponse } from "next/server";

import { verifyPassword } from "@/lib/auth/password";
import { findUserByEmail, normalizeEmail, startSession } from "@/lib/auth/users";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  const password = body?.password;
  if (!email || typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  // Same message whether the email or the password is wrong, so the form
  // never reveals which emails have accounts.
  const ok = user?.password_hash ? await verifyPassword(password, user.password_hash) : false;
  if (!user || !ok) {
    const googleOnly = user && !user.password_hash && user.google_sub;
    return NextResponse.json(
      { error: googleOnly ? "This account uses Google sign-in" : "Incorrect email or password" },
      { status: 401 },
    );
  }

  await startSession(user.id, body?.remember === true);
  return NextResponse.json({ ok: true });
}
