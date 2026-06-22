/**
 * Shared ATS keyword extraction and scoring (client + server).
 */

export const TECH_KEYWORDS_POOL = [
  "react", "typescript", "javascript", "tailwind", "next.js", "node.js", "node",
  "docker", "kubernetes", "aws", "python", "graphql", "sql", "postgresql",
  "vite", "performance", "metrics", "star", "spa", "hooks", "redux", "express",
  "developer", "engineer", "engineering", "quantifiable", "quantitative",
  "optimization", "optimize", "responsive", "profiling", "analytics",
  "database", "drizzle", "supabase", "git", "github", "ci/cd", "agile", "scrum",
];

export function extractJdKeywords(jobDescription: string): string[] {
  const jdLower = (jobDescription || "").toLowerCase();
  const matched = TECH_KEYWORDS_POOL.filter((word) => jdLower.includes(word));

  if (matched.length > 0) return matched;

  const tokens = jdLower.match(/\b[a-z][a-z0-9+#./-]{2,}\b/g) || [];
  const unique = Array.from(new Set(tokens))
    .filter((t) => t.length >= 4 && !["with", "this", "that", "will", "your", "have", "role"].includes(t))
    .slice(0, 12);

  return unique.length > 0 ? unique : ["react", "typescript", "javascript", "tailwind", "metrics", "performance"];
}

export function compileResumeText(resume: {
  personalInfo?: { name?: string; title?: string };
  summary?: string;
  experience?: Array<{ role?: string; company?: string; bullets?: string[] }>;
  skills?: string[];
}): string {
  return [
    resume.personalInfo?.name || "",
    resume.personalInfo?.title || "",
    resume.summary || "",
    ...(resume.experience || []).map(
      (exp) => `${exp.role || ""} ${exp.company || ""} ${(exp.bullets || []).join(" ")}`
    ),
    ...(resume.skills || []),
  ]
    .join(" ")
    .toLowerCase();
}

export function calculateKeywordMatchScore(resumeText: string, keywords: string[]): {
  score: number;
  detected: string[];
  missing: string[];
} {
  if (keywords.length === 0) {
    return { score: 0, detected: [], missing: [] };
  }

  const detected = keywords.filter((word) => resumeText.includes(word));
  const missing = keywords.filter((word) => !resumeText.includes(word));
  const score = Math.round((detected.length / keywords.length) * 100);

  return { score, detected, missing };
}

export function calculateLiveAtsScore(
  resume: Parameters<typeof compileResumeText>[0],
  jobDescription: string
): { score: number; detected: string[]; keywords: string[] } {
  const keywords = extractJdKeywords(jobDescription);
  const resumeText = compileResumeText(resume);
  const { score, detected } = calculateKeywordMatchScore(resumeText, keywords);
  return { score, detected, keywords };
}
