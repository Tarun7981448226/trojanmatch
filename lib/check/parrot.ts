import type { ResumeLine } from "./sections";

// Copied-from-the-job detection. Matching keywords is good (that's how ATS
// filters work); copying whole phrases word for word is what recruiters notice.
export interface CopiedLine {
  lineId: string;
  text: string;
  phrase: string; // the longest run shared with the job post
  words: number;
}

const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#.\s]/g, " ").split(/\s+/).filter(Boolean);

export function copiedFromJob(jobText: string, lines: ResumeLine[], minRun = 7): CopiedLine[] {
  const job = words(jobText);
  const jobGrams = new Set<string>();
  for (let i = 0; i + minRun <= job.length; i++) jobGrams.add(job.slice(i, i + minRun).join(" "));
  const out: CopiedLine[] = [];
  for (const line of lines) {
    const w = words(line.text);
    let best = "";
    for (let i = 0; i + minRun <= w.length; i++) {
      if (!jobGrams.has(w.slice(i, i + minRun).join(" "))) continue;
      // Grow the match as far as it keeps appearing in the job post.
      let end = i + minRun;
      while (end < w.length && jobText.toLowerCase().includes(w.slice(i, end + 1).join(" "))) end++;
      const run = w.slice(i, end).join(" ");
      if (run.length > best.length) best = run;
    }
    if (best) out.push({ lineId: line.id, text: line.text, phrase: best, words: best.split(" ").length });
  }
  return out;
}
