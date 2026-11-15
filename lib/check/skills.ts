import { findSkills, mentions } from "./lexicon";
import type { ResumeLine } from "./sections";

// For every skill the job asks for: is it proven by a bullet in Experience
// or Projects (with the exact line as proof), only listed, or missing?
export interface SkillEvidence {
  skill: string;
  status: "proven" | "listed" | "missing";
  lineId?: string;
  quote?: string;
}

export function skillEvidence(jobText: string, lines: ResumeLine[]): SkillEvidence[] {
  return findSkills(jobText).map((skill) => {
    const proof = lines.find((l) => (l.section === "experience" || l.section === "projects") && mentions(l.text, skill));
    if (proof) return { skill, status: "proven", lineId: proof.id, quote: proof.text };
    const listed = lines.find((l) => mentions(l.text, skill));
    if (listed) return { skill, status: "listed", lineId: listed.id, quote: listed.text };
    return { skill, status: "missing" };
  });
}
