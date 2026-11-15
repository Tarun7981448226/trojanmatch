import { NextRequest, NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { findUserById, normalizeSkills } from "@/lib/auth/users";
import { getSql } from "@/lib/db";

// The signed-in user's profile (no password hash ever leaves the server),
// and PATCH to update their skills, which drive the match score.
export async function GET(request: NextRequest) {
  const userId = await requireSession(request);
  const user = userId ? await findUserById(userId) : null;
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const extra = (await getSql()`select department, photo from tm_users where id = ${userId}`) as { department: string | null; photo: string | null }[];
  return NextResponse.json({
    name: user.name,
    email: user.email,
    skills: user.skills ?? [],
    department: extra[0]?.department ?? "",
    photo: extra[0]?.photo ?? null,
  });
}

export async function PATCH(request: NextRequest) {
  const userId = await requireSession(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const sql = getSql();
  if (typeof body?.department === "string") {
    await sql`update tm_users set department = ${body.department.trim().slice(0, 80)} where id = ${userId}`;
  }
  if (body && "photo" in body) {
    // A small JPEG data URL made in the browser (256px), or null to remove.
    const photo = body.photo;
    if (photo !== null && (typeof photo !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(photo) || photo.length > 300_000)) {
      return NextResponse.json({ error: "Photo must be a small image" }, { status: 400 });
    }
    await sql`update tm_users set photo = ${photo} where id = ${userId}`;
  }
  if (body && "skills" in body) {
    const skills = normalizeSkills(body.skills);
    await sql`update tm_users set skills = ${skills} where id = ${userId}`;
    return NextResponse.json({ skills });
  }
  return NextResponse.json({ ok: true });
}
