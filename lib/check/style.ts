import type { ResumeLine } from "./sections";

// "Sounds like you": style signals a recruiter skims past. This is NOT an AI
// detector (those are unreliable, and unfair to non-native English writers);
// it points at generic lines so the student can make them specific.
export interface StyleFlag {
  kind: "buzzwords" | "no_specifics" | "repeated_opener" | "weak_opener" | "uniform_length";
  label: string;
  lineIds: string[];
  examples: string[];
}

const BUZZ = /\b(spearhead(?:ed|ing)?|leverag(?:e|ed|ing)|utiliz(?:e|ed|ing)|synerg\w*|cutting[- ]edge|state[- ]of[- ]the[- ]art|seamless(?:ly)?|robust|innovative|dynamic|passionate|results[- ]driven|detail[- ]oriented|go[- ]getter|best[- ]in[- ]class|world[- ]class|game[- ]chang\w*|delve|holistic|transformative|revolutioniz\w*|empower\w*|streamlin\w*|facilitat\w*|orchestrat\w*|pivotal|meticulous\w*|tapestry|fostered)\b/gi;
const WEAK = /^(responsible for|worked on|helped( with)?|assisted( with| in)?|involved in|participated in|tasked with|duties included)\b/i;
const CONCRETE = /\d|%|\$|users?|customers?|requests?|students?|ms\b|latency|accuracy|revenue|hours?|days?|x\b/i;

export function styleFlags(lines: ResumeLine[]): StyleFlag[] {
  const bullets = lines.filter((l) => l.bullet);
  const flags: StyleFlag[] = [];

  const buzz = bullets.filter((l) => (l.text.match(BUZZ) ?? []).length > 0);
  if (buzz.length) {
    flags.push({ kind: "buzzwords", label: `${buzz.length} bullets lean on buzzwords`, lineIds: buzz.map((l) => l.id), examples: buzz.slice(0, 3).map((l) => (l.text.match(BUZZ) ?? []).join(", ")) });
  }
  const vague = bullets.filter((l) => !CONCRETE.test(l.text));
  if (vague.length) {
    flags.push({ kind: "no_specifics", label: `${vague.length} bullets have no number, scale or result`, lineIds: vague.map((l) => l.id), examples: vague.slice(0, 3).map((l) => l.text) });
  }
  const weak = bullets.filter((l) => WEAK.test(l.text));
  if (weak.length) {
    flags.push({ kind: "weak_opener", label: `${weak.length} bullets start with a weak phrase`, lineIds: weak.map((l) => l.id), examples: weak.slice(0, 3).map((l) => l.text.split(" ").slice(0, 4).join(" ")) });
  }
  const openers = new Map<string, ResumeLine[]>();
  for (const l of bullets) {
    const first = l.text.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "");
    if (first) openers.set(first, [...(openers.get(first) ?? []), l]);
  }
  const repeated = [...openers.entries()].filter(([, ls]) => ls.length >= 3);
  if (repeated.length) {
    flags.push({ kind: "repeated_opener", label: `Same first word used ${repeated.map(([w, ls]) => `"${w}" ×${ls.length}`).join(", ")}`, lineIds: repeated.flatMap(([, ls]) => ls.map((l) => l.id)), examples: repeated.map(([w]) => w) });
  }
  if (bullets.length >= 6) {
    const lens = bullets.map((l) => l.text.split(/\s+/).length);
    const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
    const sd = Math.sqrt(lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length);
    if (sd / mean < 0.15) {
      flags.push({ kind: "uniform_length", label: "Every bullet is about the same length", lineIds: [], examples: [`about ${Math.round(mean)} words each`] });
    }
  }
  return flags;
}
