import { describe, expect, it } from "vitest";

import { checkHygiene, cleanText } from "./hygiene";
import { copiedFromJob } from "./parrot";
import { splitResume } from "./sections";
import { skillEvidence } from "./skills";
import { styleFlags } from "./style";

const RESUME = [
  "Tommy Trojan",
  "EXPERIENCE",
  "Software Engineering Intern, Campus Startup",
  "• Built REST APIs in Python and FastAPI serving 2,000 daily users",
  "• Responsible for maintaining internal tools",
  "PROJECTS",
  "• Course Planner: deployed with Docker on AWS for 300 students",
  "SKILLS",
  "Python, Java, Kubernetes, PostgreSQL",
].join("\n");

describe("recruiter checks (no AI)", () => {
  const lines = splitResume(RESUME);

  it("finds sections and bullets", () => {
    expect(lines.find((l) => l.text.startsWith("Built"))?.section).toBe("experience");
    expect(lines.find((l) => l.text.startsWith("Python"))?.section).toBe("skills");
  });

  it("separates proven, listed and missing skills", () => {
    const ev = Object.fromEntries(skillEvidence("Need Python, Docker, Kubernetes and Kafka", lines).map((e) => [e.skill, e.status]));
    expect(ev).toEqual({ Python: "proven", Docker: "proven", Kubernetes: "listed", Kafka: "missing" });
  });

  it("flags phrases copied word for word from the job, not shared keywords", () => {
    const job = "You will design build and maintain scalable backend services that power our core product";
    const copied = copiedFromJob(job, splitResume("EXPERIENCE\n• Design build and maintain scalable backend services that power our core product\n• Built backend services in Python"));
    expect(copied).toHaveLength(1);
    expect(copied[0].words).toBeGreaterThanOrEqual(7);
  });

  it("spots invisible characters and cleans them", () => {
    const dirty = "Py​thon developer";
    expect(checkHygiene(dirty).some((i) => i.kind === "invisible")).toBe(true);
    expect(cleanText(dirty)).toBe("Python developer");
  });

  it("flags generic bullets without calling them AI", () => {
    const labels = styleFlags(lines).map((f) => f.kind);
    expect(labels).toContain("weak_opener");
    expect(JSON.stringify(styleFlags(lines))).not.toMatch(/\bAI\b/);
  });
});
