import { getSql } from "@/lib/db";

export interface ResumeProfile {
  name?: string;
  school?: string;
  degree?: string;
  grad_date?: string;
  work_authorization?: string;
  skills?: string[];
  experience?: { title: string; org: string; dates?: string; highlights?: string[] }[];
  projects?: { name: string; tech?: string[]; highlights?: string[] }[];
  summary?: string;
}

// Always scoped to the signed-in user's own row: resumes never mix.
export async function loadResume(userId: number): Promise<{ file_name: string; text: string; profile: ResumeProfile; uploaded_at: string } | null> {
  const rows = (await getSql()`
    select file_name, text, profile, uploaded_at from tm_resumes where user_id = ${userId}
  `) as { file_name: string; text: string; profile: ResumeProfile; uploaded_at: string }[];
  return rows[0] ?? null;
}
