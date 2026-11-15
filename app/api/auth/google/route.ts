import { createRemoteJWKSet, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

import { normalizeEmail, startSession } from "@/lib/auth/users";
import { getSql } from "@/lib/db";

// "Sign in with Google": the browser gets an ID token from Google Identity
// Services and posts it here. We check Google's signature, issuer, audience
// (our client id) and that the email is verified, then find or create the
// account. No Google secret is needed for this flow.
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export async function POST(request: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "Google sign-in is not set up" }, { status: 503 });

  const body = await request.json().catch(() => null);
  if (typeof body?.credential !== "string") {
    return NextResponse.json({ error: "Missing Google credential" }, { status: 400 });
  }

  let payload;
  try {
    ({ payload } = await jwtVerify(body.credential, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: clientId,
    }));
  } catch {
    return NextResponse.json({ error: "Google sign-in failed, try again" }, { status: 401 });
  }

  const email = normalizeEmail(payload.email);
  const sub = typeof payload.sub === "string" ? payload.sub : null;
  if (!email || !sub || payload.email_verified !== true) {
    return NextResponse.json({ error: "Your Google account's email isn't verified" }, { status: 401 });
  }
  const name = typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : email.split("@")[0];

  // Same person by Google id, or an existing email account they now link.
  const rows = (await getSql()`
    insert into tm_users (email, name, google_sub)
    values (${email}, ${name}, ${sub})
    on conflict (email) do update set google_sub = coalesce(tm_users.google_sub, excluded.google_sub)
    returning id, google_sub
  `) as { id: number; google_sub: string }[];
  if (rows[0].google_sub !== sub) {
    return NextResponse.json({ error: "This email is linked to a different Google account" }, { status: 409 });
  }

  await startSession(rows[0].id, true);
  return NextResponse.json({ ok: true });
}
