import { NextRequest, NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { findUserById } from "@/lib/auth/users";
import { getSql } from "@/lib/db";
import { STRONG_MATCH } from "@/lib/dashboard/types";

// Per-user numbers only: the signed-in user's decisions and matches.
export async function GET(request: NextRequest) {
  const userId = await requireSession(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const user = await findUserById(userId);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const skills = user.skills ?? [];
  const sql = getSql();
  const [decisions, feed] = (await Promise.all([
    sql`
      select
        count(*) filter (where decision = 'saved') as saved,
        count(*) filter (where decision = 'applied') as applied,
        count(*) filter (where decision = 'not_interested') as not_interested
      from tm_decisions where user_id = ${userId}
    `,
    sql`
      select
        count(*) as total,
        count(*) filter (where cardinality(${skills}::text[]) > 0 and 100.0 * (
          select count(*) from unnest(${skills}::text[]) s
          where position(s in lower(j.role || ' ' || coalesce(j.jd_text, ''))) > 0
        ) / cardinality(${skills}::text[]) >= ${STRONG_MATCH}) as strong
      from jobs j
    `,
  ])) as Record<string, string>[][];

  return NextResponse.json({
    totalJobs: Number(feed[0].total),
    strongMatches: Number(feed[0].strong),
    saved: Number(decisions[0].saved),
    applied: Number(decisions[0].applied),
    notInterested: Number(decisions[0].not_interested),
  });
}
