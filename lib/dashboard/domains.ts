// Job domains for the domain bar. Each is a Postgres regex (case-insensitive,
// \y = word boundary) on the job title; first match wins, so the more
// specific domains come first. scripts/classify_jobs.ts writes the result
// to jobs.tm_domain once, so the feed just filters on that column.
export const DOMAINS = [
  { key: "genai", label: "GenAI & Agents", pattern: "agent|agentic|genai|gen ai|generative|\\yllms?\\y|large language|foundation model|prompt|conversational ai|\\yrag\\y" },
  { key: "fde", label: "Forward Deployed & Solutions", pattern: "forward deployed|solutions? (engineer|architect|consultant)|sales engineer|customer engineer|implementation engineer|technical account|field engineer" },
  { key: "robotics_cv", label: "Robotics & Vision", pattern: "robot|computer vision|perception|autonom|\\yslam\\y|lidar|embodied|\\yvision\\y" },
  { key: "ai_ml", label: "AI / ML", pattern: "machine learning|\\yml\\y|\\yai\\y|artificial intelligence|deep learning|mlops|applied scien|\\ynlp\\y|recommend" },
  { key: "security", label: "Cybersecurity", pattern: "security|cyber|infosec|threat|penetration|appsec|detection|privacy engineer" },
  { key: "data_eng", label: "Data Engineering", pattern: "data engineer|data platform|\\yetl\\y|analytics engineer|data infrastructure|database" },
  { key: "quant_finance", label: "Quant & Finance", pattern: "quant|trading|trader|financ|accounting|accountant|investment|treasury|\\ytax\\y|audit|controller|fp&a|actuar|payroll" },
  { key: "data_science", label: "Data Science & Analytics", pattern: "data scien|analytics|data analyst|statistic|business intelligence|insights|economist" },
  { key: "cloud", label: "Cloud / DevOps / SRE", pattern: "devops|\\ysre\\y|site reliability|cloud|infrastructure|platform engineer|kubernetes|network engineer|systems engineer|distributed systems" },
  { key: "hardware", label: "Hardware & Embedded", pattern: "hardware|embedded|firmware|\\yasic\\y|fpga|silicon|circuit|electrical|\\ychip|\\yrtl\\y|semiconductor|mechanical" },
  { key: "research", label: "Research", pattern: "research|scientist|\\yphd\\y" },
  { key: "pm", label: "Product Management", pattern: "product manag|product owner|\\ypm\\y|program manag|technical program" },
  { key: "design", label: "Design (UX/UI)", pattern: "design|\\yux\\y|\\yui\\y|user experience|creative|motion|video|graphic" },
  { key: "swe", label: "Software Engineering", pattern: "software|\\yswe\\y|developer|engineer|\\ysde\\y|full.?stack|back.?end|front.?end|mobile|\\yios\\y|android|\\yweb\\y" },
  { key: "sales_mkt", label: "Sales & Marketing", pattern: "sales|account executive|marketing|growth|brand|communications|partnership|business development|\\ysdr\\y|\\ybdr\\y|customer success|account manag|content|social media" },
  { key: "business_ops", label: "Business, Ops & Consulting", pattern: "operations|strategy|consult|business|project manag|recruit|people|\\yhr\\y|legal|counsel|policy|supply chain|procurement|analyst|associate" },
] as const;

export type DomainKey = (typeof DOMAINS)[number]["key"] | "other";

export const DOMAIN_LABELS: Record<string, string> = Object.fromEntries([
  ...DOMAINS.map((d) => [d.key, d.label]),
  ["other", "Other"],
]);

export function isDomainKey(value: string | null | undefined): value is DomainKey {
  return value === "other" || DOMAINS.some((d) => d.key === value);
}

// Level: "student" titles say so; "experienced" titles are senior; the
// rest are "general" and still count as student-friendly.
export const STUDENT_PATTERN = "\\yinterns?\\y|internship|co-?op|new grad|graduate|university|campus|early career|entry|junior|apprentice|fellow|student|\\y202[67]\\y";
export const EXPERIENCED_PATTERN = "senior|\\ysr\\y|staff|principal|\\ylead\\y|head of|\\yhead\\y|director|manager|\\yvp\\y|chief|architect|\\yiii\\y|\\yiv\\y";

export const ROLE_TYPES = [
  { key: "internship", label: "Internship" },
  { key: "new_grad", label: "New grad / Entry" },
  { key: "full_time", label: "Full-time" },
  { key: "contract", label: "Contract" },
  { key: "part_time", label: "Part-time" },
] as const;
export function isRoleType(value: string | null | undefined): boolean {
  return ROLE_TYPES.some((t) => t.key === value);
}
