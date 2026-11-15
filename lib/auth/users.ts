import { cookies } from "next/headers";

import { createSessionToken, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";
import { getSql } from "@/lib/db";

// Account rules shared by sign-up, login, password reset and Google sign-in.
// Emails are compared lower-case; passwords only ever exist as bcrypt hashes.

export interface UserRow {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  password_hash: string | null;
  google_sub: string | null;
  skills: string[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MIN_PASSWORD_LENGTH = 8;

export function normalizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const value = email.trim().toLowerCase();
  return EMAIL_RE.test(value) && value.length <= 254 ? value : null;
}

/** Digits with an optional leading +, 7 to 15 digits (E.164 length). */
export function normalizePhone(phone: unknown): string | null | undefined {
  if (phone === undefined || phone === null || phone === "") return null;
  if (typeof phone !== "string") return undefined;
  const value = phone.replace(/[\s().-]/g, "");
  return /^\+?\d{7,15}$/.test(value) ? value : undefined;
}

export function normalizeSkills(skills: unknown): string[] {
  const raw = Array.isArray(skills) ? skills : typeof skills === "string" ? skills.split(",") : [];
  const clean = raw
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0 && s.length <= 40);
  return [...new Set(clean)].slice(0, 30);
}

export function passwordProblem(password: unknown): string | null {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (password.length > 200) return "Password is too long";
  return null;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const rows = (await getSql()`select * from tm_users where email = ${email}`) as UserRow[];
  return rows[0] ?? null;
}

export async function findUserById(id: number): Promise<UserRow | null> {
  const rows = (await getSql()`select * from tm_users where id = ${id}`) as UserRow[];
  return rows[0] ?? null;
}

export async function startSession(userId: number, remember: boolean): Promise<void> {
  const token = await createSessionToken(userId, remember);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions(remember));
}
