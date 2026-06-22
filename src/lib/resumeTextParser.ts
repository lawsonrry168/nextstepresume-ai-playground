/**
 * Rule-based plain-text resume → ResumeData parser.
 * Supports common section headers and bullet formats.
 */

import { ResumeData } from "../types";
import { initialResumeData } from "../data";

const SECTION_PATTERNS: Array<{ key: string; regex: RegExp }> = [
  { key: "summary", regex: /^(professional\s+)?summary|profile|about\s+me|個人簡介|自我介紹/i },
  { key: "experience", regex: /^(work\s+)?experience|employment|professional\s+experience|工作經歷|經歷/i },
  { key: "education", regex: /^education|academic|學歷|教育/i },
  { key: "skills", regex: /^(technical\s+)?skills|core\s+competencies|technologies|技能/i },
  { key: "projects", regex: /^projects|portfolio|專案/i },
];

function detectEmail(text: string): string {
  return text.match(/[\w.+-]+@[\w.-]+\.\w{2,}/)?.[0] || "";
}

function detectPhone(text: string): string {
  return text.match(/(\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() || "";
}

function detectUrl(text: string): string {
  return text.match(/https?:\/\/[^\s]+/)?.[0] || "";
}

function parseBullets(lines: string[]): string[] {
  return lines
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[-•*●▪]\s*/, "").trim())
    .filter((l) => l.length > 3);
}

function splitSections(text: string): Map<string, string[]> {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const sections = new Map<string, string[]>();
  let current = "header";
  sections.set(current, []);

  for (const line of lines) {
    if (!line) continue;

    const matched = SECTION_PATTERNS.find((p) => p.regex.test(line.replace(/[#:*]/g, "").trim()));
    if (matched && line.length < 60) {
      current = matched.key;
      if (!sections.has(current)) sections.set(current, []);
      continue;
    }

    sections.get(current)?.push(line);
  }

  return sections;
}

function parseExperienceBlocks(lines: string[]): ResumeData["experience"] {
  const blocks: ResumeData["experience"] = [];
  let current: ResumeData["experience"][0] | null = null;

  for (const line of lines) {
    const isBullet = /^[-•*●▪]/.test(line);
    if (!isBullet) {
      if (current) blocks.push(current);
      const dateMatch = line.match(/(\d{4}(?:-\d{2})?)\s*[-–—]\s*(\d{4}(?:-\d{2})?|present|current|現在)/i);
      const roleCompany = line.replace(/\d{4}.*$/i, "").trim();
      const parts = roleCompany.split(/\s+[-@|]\s+|\s+at\s+/i);

      current = {
        id: `exp-${blocks.length + 1}`,
        company: parts.length > 1 ? parts[parts.length - 1] : "",
        role: parts[0] || line,
        startDate: dateMatch?.[1] || "",
        endDate: dateMatch?.[2] || "",
        location: "",
        bullets: [],
      };
    } else if (current) {
      current.bullets.push(line.replace(/^[-•*●▪]\s*/, "").trim());
    }
  }

  if (current) blocks.push(current);
  return blocks.length > 0 ? blocks : initialResumeData.experience;
}

function parseEducation(lines: string[]): ResumeData["education"] {
  if (lines.length === 0) return initialResumeData.education;

  return lines.slice(0, 3).map((line, i) => {
    const degreeMatch = line.match(/(b\.?s\.?|m\.?s\.?|bachelor|master|ph\.?d\.?)/i);
    const yearMatch = line.match(/\b(19|20)\d{2}\b/);
    return {
      id: `edu-${i + 1}`,
      institution: line.split(/,|\|/)[0]?.trim() || line,
      degree: degreeMatch?.[0] || "Degree",
      field: line.includes("Science") || line.includes("Engineering") ? "Computer Science" : "",
      gradDate: yearMatch?.[0] || "",
      location: "",
    };
  });
}

export function parseResumeText(rawText: string): ResumeData {
  const text = rawText.trim();
  if (text.length < 20) {
    throw new Error("Resume text is too short to parse");
  }

  const sections = splitSections(text);
  const headerLines = sections.get("header") || [];
  const fullHeader = headerLines.join("\n");

  const name = headerLines.find((l) => !l.includes("@") && !/^\+?\d/.test(l) && l.length < 50) || "Imported Candidate";
  const title =
    headerLines.find((l) => /developer|engineer|manager|designer|analyst/i.test(l)) ||
    headerLines[1] ||
    "Professional";

  const summaryLines = sections.get("summary") || [];
  const summary = summaryLines.length > 0 ? summaryLines.join(" ") : headerLines.slice(2, 5).join(" ");

  const skillLines = sections.get("skills") || [];
  const skills = skillLines
    .join(", ")
    .split(/[,;|•]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 40);

  const experience = parseExperienceBlocks(sections.get("experience") || []);
  const education = parseEducation(sections.get("education") || []);

  return {
    personalInfo: {
      name: name.replace(/[|•]/g, "").trim(),
      title: title.replace(/[|•]/g, "").trim(),
      email: detectEmail(fullHeader + "\n" + text),
      phone: detectPhone(fullHeader + "\n" + text),
      website: detectUrl(text),
      location: headerLines.find((l) => /,\s*[A-Z]{2}\b|taiwan|taipei|austin|remote/i.test(l)) || "",
      linkedin: text.match(/linkedin\.com\/[^\s]+/i)?.[0] || "",
    },
    summary: summary || initialResumeData.summary,
    experience,
    education,
    projects: initialResumeData.projects,
    skills: skills.length > 0 ? skills : initialResumeData.skills,
  };
}
