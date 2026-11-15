// Quick local run of the no-AI checks: npx tsx scripts/try_check.ts resume.pdf job.txt
import fs from "fs";

import { readPdf } from "../lib/check/extract";
import { runDeterministic } from "../lib/check";

const [pdfPath, jobPath] = process.argv.slice(2);
(async () => {
  const pdf = await readPdf(new Uint8Array(fs.readFileSync(pdfPath)));
  const report = runDeterministic(pdf, fs.readFileSync(jobPath, "utf8"));
  console.log("lines:", report.lines.length, "| sections:", [...new Set(report.lines.map((l) => l.section))].join(","), "| bullets:", report.lines.filter((l) => l.bullet).length);
  console.log("meta:", pdf.meta);
  console.log("hygiene:", report.hygiene.map((h) => `${h.severity}:${h.label}`));
  console.log("evidence:", report.evidence.map((e) => `${e.skill}=${e.status}`).join(" | "));
  console.log("copied:", report.copied.map((c) => `${c.lineId} "${c.phrase}"`));
  console.log("style:", report.style.map((s) => s.label));
  console.log("ats:", report.ats.map((a) => `${a.ok ? "✓" : "✗"} ${a.label}: ${a.detail}`));
})();
