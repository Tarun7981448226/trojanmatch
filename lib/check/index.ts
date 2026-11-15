import { atsChecks, type AtsCheck } from "./ats";
import type { PdfFacts } from "./extract";
import { checkHygiene, cleanText, type HygieneIssue } from "./hygiene";
import { copiedFromJob, type CopiedLine } from "./parrot";
import { splitResume, type ResumeLine } from "./sections";
import { skillEvidence, type SkillEvidence } from "./skills";
import { styleFlags, type StyleFlag } from "./style";

// Everything a recruiter-style check can know without AI. Runs in
// milliseconds, so the page can show it before any agent answers.
export interface Stuffing {
  level: "honest" | "some_stuffing" | "heavy_stuffing";
  jobSkills: number; // skills the job names
  proven: number; // shown in experience/project bullets
  listedOnly: number; // named on the resume without proof
  copiedLines: number; // lines that copy the job post word for word
  reasons: string[];
}

function measureStuffing(evidence: SkillEvidence[], copied: CopiedLine[]): Stuffing {
  const proven = evidence.filter((e) => e.status === "proven").length;
  const listedOnly = evidence.filter((e) => e.status === "listed").length;
  const named = proven + listedOnly;
  const reasons: string[] = [];
  if (copied.length) reasons.push(`${copied.length} line(s) copy the job post word for word`);
  if (named >= 3 && listedOnly / named >= 0.5) reasons.push(`${listedOnly} of the job's ${named} skills you mention have no project or experience behind them`);
  const level = copied.length >= 2 || (named >= 4 && listedOnly / named >= 0.6) ? "heavy_stuffing" : reasons.length ? "some_stuffing" : "honest";
  return { level, jobSkills: evidence.length, proven, listedOnly, copiedLines: copied.length, reasons };
}

export interface DeterministicReport {
  lines: ResumeLine[];
  hygiene: HygieneIssue[];
  evidence: SkillEvidence[];
  copied: CopiedLine[];
  style: StyleFlag[];
  ats: AtsCheck[];
  stuffing: Stuffing;
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
  const evidence = skillEvidence(jobText, lines);
  const copied = copiedFromJob(jobText, lines);
  return {
    lines,
    hygiene,
    evidence,
    copied,
    stuffing: measureStuffing(evidence, copied),
    style: styleFlags(lines),
    ats: atsChecks(visible, lines, pdf.pages, pdf.links),
  };
}
