import type { PdfFacts } from "./extract";

// "ATS hygiene": things in a resume file that break resume parsers or look
// like tricks to a recruiter. This is not about hiding AI use; it's about a
// clean file that every applicant tracking system reads correctly.
export interface HygieneIssue {
  kind: "invisible" | "spacing" | "hidden_text" | "metadata" | "typography";
  severity: "high" | "medium" | "low";
  label: string;
  detail: string;
  count: number;
  samples?: string[];
}

const INVISIBLE: [RegExp, string][] = [
  [/[​‌‍⁠﻿᠎]/g, "zero-width characters"],
  [/[‪-‮⁦-⁩]/g, "text-direction control characters"],
  [/[\u{E0000}-\u{E007F}]/gu, "invisible tag characters"],
  [/­/g, "soft hyphens"],
];

const KNOWN_TOOLS = /chatgpt|openai|claude|anthropic|gemini|copilot|canva|rezi|kickresume|teal|enhancv|zety|novoresume|resume\.io|resumeworded|reportlab|wkhtmltopdf/i;

export function checkHygiene(text: string, pdf?: Pick<PdfFacts, "meta" | "tinyText" | "offPageText">): HygieneIssue[] {
  const issues: HygieneIssue[] = [];
  for (const [re, name] of INVISIBLE) {
    const count = (text.match(re) ?? []).length;
    if (count) {
      issues.push({ kind: "invisible", severity: "high", label: `${count} ${name}`, detail: "Invisible characters can split words so an ATS misses your keywords.", count });
    }
  }
  const nbsp = (text.match(/[  ]/g) ?? []).length;
  if (nbsp) issues.push({ kind: "spacing", severity: "low", label: `${nbsp} non-breaking spaces`, detail: "Usually harmless, but some parsers read them as odd symbols.", count: nbsp });

  const hidden = [...(pdf?.tinyText ?? []), ...(pdf?.offPageText ?? [])];
  if (hidden.length) {
    issues.push({
      kind: "hidden_text",
      severity: "high",
      label: `${hidden.length} pieces of text a reader can't see`,
      detail: "Tiny or off-page text looks like keyword stuffing. Recruiters treat it as an instant reject. Remove it.",
      count: hidden.length,
      samples: hidden.slice(0, 5),
    });
  }

  const tool = [pdf?.meta.producer, pdf?.meta.creator].filter(Boolean).join(" · ");
  if (tool && KNOWN_TOOLS.test(tool)) {
    issues.push({ kind: "metadata", severity: "low", label: "File details name the tool that made it", detail: `PDF metadata says: "${tool}". Recruiters rarely look, but a fresh export from Trojan JobMatch replaces it.`, count: 1 });
  }

  const dashes = (text.match(/—/g) ?? []).length;
  const curly = (text.match(/[‘’“”]/g) ?? []).length;
  if (dashes + curly > 0) {
    issues.push({ kind: "typography", severity: "low", label: "Fancy punctuation", detail: `${dashes} em dashes, ${curly} curly quotes. Fine for people; a few older ATS show them as "?".`, count: dashes + curly });
  }
  return issues;
}

/** Same text without anything that trips parsers; meaning is unchanged. */
export function cleanText(text: string): string {
  let out = text;
  for (const [re] of INVISIBLE) out = out.replace(re, "");
  return out.replace(/[  ]/g, " ");
}
