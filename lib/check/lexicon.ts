// Skills and tools we look for in job posts and resumes. Each entry is
// [canonical name, regex alternatives]. Patterns are matched case-insensitively
// with word boundaries, so "Go" won't match "good" and "R" needs care.
export const SKILLS: [string, string][] = [
  ["Python", "python"], ["Java", "java(?!script)"], ["JavaScript", "javascript|\\bjs\\b"], ["TypeScript", "typescript|\\bts\\b"],
  ["C++", "c\\+\\+|cpp"], ["C#", "c#|\\.net|dotnet"], ["C", "\\bc\\b(?![+#])"], ["Go", "golang|\\bgo\\b(?=\\s*(?:lang|,|/|\\)|$))"],
  ["Rust", "rust"], ["Kotlin", "kotlin"], ["Swift", "swift"], ["Scala", "scala"], ["Ruby", "ruby"], ["PHP", "php"],
  ["R", "\\br\\b(?=\\s*(?:,|/|\\)|programming|studio))"], ["MATLAB", "matlab"], ["SQL", "\\bsql\\b"], ["Bash", "bash|shell scripting"],
  ["HTML/CSS", "html|css"], ["React", "react(?:\\.js|js)?(?! native)"], ["React Native", "react native"], ["Next.js", "next\\.?js"],
  ["Vue", "vue(?:\\.js)?"], ["Angular", "angular"], ["Node.js", "node(?:\\.js|js)?"], ["Express", "express(?:\\.js)?"],
  ["Django", "django"], ["Flask", "flask"], ["FastAPI", "fastapi"], ["Spring Boot", "spring(?: boot)?"], ["GraphQL", "graphql"],
  ["REST APIs", "rest(?:ful)? apis?|\\brest\\b"], ["gRPC", "grpc"], ["Microservices", "microservices?"],
  ["PostgreSQL", "postgres(?:ql)?"], ["MySQL", "mysql"], ["MongoDB", "mongo(?:db)?"], ["Redis", "redis"], ["SQLite", "sqlite"],
  ["DynamoDB", "dynamodb"], ["Cassandra", "cassandra"], ["Elasticsearch", "elasticsearch|opensearch"], ["Snowflake", "snowflake"],
  ["BigQuery", "bigquery"], ["Spark", "spark|pyspark"], ["Hadoop", "hadoop"], ["Kafka", "kafka"], ["Airflow", "airflow"], ["dbt", "\\bdbt\\b"],
  ["AWS", "\\baws\\b|amazon web services|\\bec2\\b|\\bs3\\b|lambda"], ["GCP", "\\bgcp\\b|google cloud"], ["Azure", "azure"],
  ["Docker", "docker|containeri[sz]ation"], ["Kubernetes", "kubernetes|\\bk8s\\b"], ["Terraform", "terraform"], ["CI/CD", "ci/cd|github actions|jenkins|circleci|gitlab ci"],
  ["Linux", "linux|unix"], ["Git", "\\bgit\\b|github|gitlab"], ["Machine Learning", "machine learning|\\bml\\b"], ["Deep Learning", "deep learning|neural networks?"],
  ["PyTorch", "pytorch|\\btorch\\b"], ["TensorFlow", "tensorflow|keras"], ["scikit-learn", "scikit-?learn|sklearn"], ["Pandas", "pandas"], ["NumPy", "numpy"],
  ["NLP", "\\bnlp\\b|natural language processing"], ["Computer Vision", "computer vision|opencv"], ["LLMs", "\\bllms?\\b|large language models?|gpt|gemini|claude"],
  ["RAG", "\\brag\\b|retrieval[- ]augmented"], ["AI Agents", "agentic|ai agents?|multi-agent|langchain|langgraph"], ["MLOps", "mlops|mlflow|kubeflow"],
  ["Hugging Face", "hugging ?face|transformers library"], ["Statistics", "statistics|statistical|a/b test(?:ing)?|hypothesis testing"],
  ["Data Analysis", "data analysis|data analytics"], ["Tableau", "tableau"], ["Power BI", "power ?bi"], ["Excel", "excel|spreadsheets?"],
  ["Figma", "figma"], ["UX Research", "ux research|user research|usability testing"], ["Product Management", "product management|roadmap|prd"],
  ["Agile", "agile|scrum|kanban|jira"], ["Testing", "unit test(?:s|ing)?|pytest|jest|selenium|cypress|test automation"],
  ["Distributed Systems", "distributed systems?"], ["System Design", "system design|scalab(?:le|ility)"], ["Data Structures & Algorithms", "data structures|algorithms"],
  ["OOP", "object[- ]oriented|\\boop\\b"], ["Security", "cybersecurity|security|penetration testing|owasp"], ["Networking", "tcp/ip|networking|dns"],
  ["Embedded", "embedded|firmware|rtos|microcontroller"], ["Verilog/VHDL", "verilog|vhdl|fpga"], ["CAD", "solidworks|autocad|\\bcad\\b"],
  ["iOS", "\\bios\\b|swiftui"], ["Android", "android"], ["Unity", "unity3d|\\bunity\\b"], ["Blockchain", "blockchain|solidity|web3"],
  ["Communication", "communication skills|public speaking|presentations?"], ["Leadership", "leadership|led a team|team lead"],
];

const COMPILED = SKILLS.map(([name, pattern]) => [name, new RegExp(`(?:^|[^a-z0-9+#])(?:${pattern})(?=$|[^a-z0-9+#])`, "i")] as const);

/** Canonical skill names that appear in the text. */
export function findSkills(text: string): string[] {
  return COMPILED.filter(([, re]) => re.test(text)).map(([name]) => name);
}

export function mentions(text: string, skill: string): boolean {
  const hit = COMPILED.find(([name]) => name === skill);
  return hit ? hit[1].test(text) : false;
}
