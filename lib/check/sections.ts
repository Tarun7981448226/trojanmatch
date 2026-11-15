// Splits resume text (one visual line per line) into sections and bullets.
export type SectionName = "header" | "summary" | "education" | "experience" | "projects" | "skills" | "other";

const HEADINGS: [SectionName, RegExp][] = [
  ["summary", /^(summary|profile|objective|about me)\b/i],
  ["education", /^(education|academics?)\b/i],
  ["experience", /^(work |professional |relevant )?(experience|employment|work history|internships?)\b/i],
  ["projects", /^(academic |personal |selected |technical )?projects?\b/i],
  ["skills", /^(technical |core )?(skills|technologies|tech stack|tools)\b/i],
  ["other", /^(certifications?|awards|honors|leadership|activities|publications|volunteer(ing)?|coursework|interests)\b/i],
];

export interface ResumeLine {
  id: string; // L1, L2, ... stable ids the agents cite
  section: SectionName;
  text: string;
  bullet: boolean;
}

export function splitResume(text: string): ResumeLine[] {
  let section: SectionName = "header";
  const out: ResumeLine[] = [];
  text.split("\n").forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const heading = line.length <= 40 ? HEADINGS.find(([, re]) => re.test(line.replace(/[:•▪●-]/g, "").trim())) : undefined;
    if (heading) {
      section = heading[0];
      return;
    }
    const bullet = /^[•▪●◦\-*–]\s*/.test(line) || ((section === "experience" || section === "projects") && line.length > 60);
    out.push({ id: `L${i + 1}`, section, text: line.replace(/^[•▪●◦\-*–]\s*/, ""), bullet });
  });
  return out;
}
