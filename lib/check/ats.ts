import type { ResumeLine } from "./sections";

// Format checks an applicant tracking system (and a 6-second recruiter skim) cares about.
export interface AtsCheck {
  label: string;
  ok: boolean;
  detail: string;
}

export function atsChecks(text: string, lines: ResumeLine[], pages: number, links: string[]): AtsCheck[] {
  const sections = new Set(lines.map((l) => l.section));
  const email = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(text);
  const phone = /\+?\d[\d\s().-]{8,}\d/.test(text);
  const linkText = `${text} ${links.join(" ")}`;
  const linkedin = /linkedin\.com\/in\//i.test(linkText);
  const github = /github\.com\//i.test(linkText);
  const grad = /(may|june|dec(ember)?|august|spring|fall|summer|expected)\s*[,']?\s*20\d\d|20\d\d\s*[-–]\s*20\d\d/i.test(text);
  return [
    { label: "One page", ok: pages <= 1, detail: pages <= 1 ? "Fits on one page." : `${pages} pages. Students should keep to one.` },
    { label: "Contact info", ok: email && phone, detail: email && phone ? "Email and phone found." : `Missing ${[!email && "email", !phone && "phone"].filter(Boolean).join(" and ")}.` },
    { label: "Standard sections", ok: sections.has("education") && (sections.has("experience") || sections.has("projects")) && sections.has("skills"), detail: `Found: ${[...sections].filter((s) => s !== "header").join(", ") || "none"}.` },
    { label: "Graduation date", ok: grad, detail: grad ? "Graduation date found." : "Add your (expected) graduation month and year; recruiters check it first." },
    { label: "LinkedIn / GitHub", ok: linkedin || github, detail: [linkedin && "LinkedIn", github && "GitHub"].filter(Boolean).join(" + ") || "Add a LinkedIn or GitHub link." },
  ];
}
