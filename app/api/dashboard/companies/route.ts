import { NextRequest, NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { getSql } from "@/lib/db";
import { isDomainKey } from "@/lib/dashboard/domains";

// Companies for the company picker, with job counts, narrowed to the
// selected domain and student-roles setting so every option has results.
export async function GET(request: NextRequest) {
  if (!(await requireSession(request))) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const params = request.nextUrl.searchParams;
  const domainParam = params.get("domain");
  const domain = isDomainKey(domainParam) ? domainParam : null;
  const studentOnly = params.get("level") !== "all";
  const rows = await getSql()`
    select company, count(*)::int as n from jobs
    where company is not null and company <> ''
      and (${domain}::text is null or tm_domain = ${domain})
      and (not ${studentOnly}::boolean or tm_level is distinct from 'experienced')
    group by company order by n desc, company limit 300
  `;
  return NextResponse.json({ companies: rows });
}
