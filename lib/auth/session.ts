import { jwtVerify, SignJWT } from "jose";
import type { NextRequest } from "next/server";

// Multi-user sessions: a signed JWT in an httpOnly cookie whose `sub` is the
// tm_users id. jose runs on the Edge runtime, so proxy.ts can verify the
// same token before a protected page renders.

export const SESSION_COOKIE_NAME = "trojanmatch_session";
const LONG_SESSION_SECONDS = 60 * 60 * 24 * 30; // "Keep me logged in": 30 days
const SHORT_SESSION_SECONDS = 60 * 60 * 12; // otherwise the token itself lasts 12 hours

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId: number, remember: boolean): Promise<string> {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${remember ? LONG_SESSION_SECONDS : SHORT_SESSION_SECONDS}s`)
    .sign(getSecretKey());
}

/** The signed-in user's id, or null for a missing, forged or expired token. */
export async function verifySessionToken(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const id = Number(payload.sub);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

// proxy.ts already blocks unauthenticated requests to /api/dashboard/:path*,
// but each protected route re-verifies too and uses the id it returns.
export async function requireSession(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return token ? verifySessionToken(token) : null;
}

/** Cookie options: "Keep me logged in" makes it last 30 days; otherwise it
 * is a browser-session cookie that goes away when the browser closes. */
export function sessionCookieOptions(remember: boolean) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(remember ? { maxAge: LONG_SESSION_SECONDS } : {}),
  };
}
