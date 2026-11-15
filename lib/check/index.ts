import { atsChecks, type AtsCheck } from "./ats";
import type { PdfFacts } from "./extract";
import { checkHygiene, cleanText, type HygieneIssue } from "./hygiene";
import { copiedFromJob, type CopiedLine } from "./parrot";
import { splitResume, type ResumeLine } from "./sections";
import { skillEvidence, type SkillEvidence } from "./skills";
import { styleFlags, type StyleFlag } from "./style";

// Everything a recruiter-style check can know without AI. Runs in
// milliseconds, so the page can show it before any agent answers.
export interface DeterministicReport {
  lines: ResumeLine[];
  hygiene: HygieneIssue[];
  evidence: SkillEvidence[];
  copied: CopiedLine[];
  style: StyleFlag[];
  ats: AtsCheck[];
}

export function runDeterministic(pdf: PdfFacts, jobText: string): DeterministicReport {
  const hygiene = checkHygiene(pdf.text, pdf);
  // Agents and later checks only ever see the cleaned text, with hidden text removed.
  const hidden = new Set([...pdf.tinyText, ...pdf.offPageText]);
  const visible = cleanText(pdf.text)
    .split("\n")
    .filter((l) => !hidden.has(l.trim()))
    .join("\n");
  const lines = splitResume(visible);
  return {
    lines,
    hygiene,
    evidence: skillEvidence(jobText, lines),
    copied: copiedFromJob(jobText, lines),
    style: styleFlags(lines),
    ats: atsChecks(visible, lines, pdf.pages, pdf.links),
  };
}
