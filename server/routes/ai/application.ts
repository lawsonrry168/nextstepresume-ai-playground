import type { Express } from "express";
import type { GoogleGenAI } from "@google/genai";
import { parseAiJson, withMarketWritingGuide } from "../../lib/aiContext.ts";

import {
  getSimulatedCompanyResearch,
  getSimulatedCoverLetter,
  getSimulatedInterviewPrep,
} from "../../simulation/engine.ts";

export function registerAiApplicationRoutes(app: Express, ai: GoogleGenAI | null): void {
// REST API for AI Cover Letter generation
  app.post("/api/cover-letter", async (req, res) => {
  const {
    resumeData,
    jobDescription,
    companyName = "",
    jobTitle = "",
    tone = "professional",
  } = req.body;

  if (!resumeData) {
    return res.status(400).json({ error: "resumeData is required" });
  }
  if (!jobDescription || String(jobDescription).trim().length === 0) {
    return res.status(400).json({ error: "jobDescription is required" });
  }

  const coverTone =
    tone === "enthusiastic" || tone === "concise" ? tone : "professional";

  if (!ai) {
    return res.json({
      ...getSimulatedCoverLetter(resumeData, jobDescription, companyName, jobTitle, coverTone),
      meta: { source: "simulation", simulated: true },
    });
  }

  try {
    const resumeText =
      typeof resumeData === "string" ? resumeData : JSON.stringify(resumeData, null, 2);

    const toneGuide =
      coverTone === "enthusiastic"
        ? "Use an enthusiastic but professional tone with confident energy."
        : coverTone === "concise"
        ? "Use a concise, direct tone — shorter paragraphs, no filler."
        : "Use a polished, professional corporate tone.";

    const prompt = `
You are an elite career coach and cover letter writer for premium job applications (nextstepresume.ai style).
Write a tailored cover letter comparing the candidate resume to the target job description.

Tone: ${coverTone.toUpperCase()}
${toneGuide}

Target company: ${companyName || "Not specified — infer from JD if possible"}
Target role: ${jobTitle || "Not specified — infer from JD"}

Return strict JSON only, matching this schema:
{
  "salutation": "Dear Hiring Manager," or personalized if company known,
  "opening": "First paragraph hook — role interest + 1-line value proposition",
  "bodyParagraphs": ["2-3 paragraphs bridging resume strengths to JD requirements with specifics"],
  "closing": "Call to action + gratitude paragraph",
  "signature": "Sincerely,\\n[Candidate Name]",
  "fullText": "Complete letter as plain text with paragraph breaks",
  "tone": "${coverTone}"
}

Resume:
${resumeText}

Job Description:
${jobDescription}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: withMarketWritingGuide(req, prompt),
      config: {
        responseMimeType: "application/json",
        systemInstruction:
          "You are an expert cover letter writer. Return raw JSON matching the schema exactly.",
        temperature: 0.35,
      },
    });

    const textOutput = response.text?.trim() || "{}";
    const result = parseAiJson(textOutput, () =>
      getSimulatedCoverLetter(resumeData, jobDescription, companyName, jobTitle, coverTone)
    );
    return res.json({ ...result, meta: { source: "gemini", simulated: false } });
  } catch (error: unknown) {
    console.error("Gemini cover letter error:", error);
    return res.status(500).json({
      error: "Failed to generate cover letter",
      fallback: getSimulatedCoverLetter(
        resumeData,
        jobDescription,
        companyName,
        jobTitle,
        coverTone
      ),
      meta: { source: "simulation", simulated: true },
    });
  }
});

// REST API for AI Interview Preparation
  app.post("/api/interview-prep", async (req, res) => {
  const {
    resumeData,
    jobDescription,
    companyName = "",
    jobTitle = "",
    matchAnalysis,
  } = req.body;

  if (!resumeData) {
    return res.status(400).json({ error: "resumeData is required" });
  }
  if (!jobDescription || String(jobDescription).trim().length === 0) {
    return res.status(400).json({ error: "jobDescription is required" });
  }

  const company =
    companyName?.trim() ||
    jobDescription.match(/at\s+([A-Z][A-Za-z0-9\s.&]{2,30})/)?.[1]?.trim() ||
    "Target Company";
  const role =
    jobTitle?.trim() ||
    (typeof resumeData === "object" && resumeData?.personalInfo?.title) ||
    "Target Role";

  if (!ai) {
    return res.json({
      ...getSimulatedInterviewPrep(resumeData, jobDescription, company, role, matchAnalysis),
      meta: { source: "simulation", simulated: true },
    });
  }

  try {
    const resumeText =
      typeof resumeData === "string" ? resumeData : JSON.stringify(resumeData, null, 2);
    const matchContext = matchAnalysis
      ? JSON.stringify(matchAnalysis, null, 2)
      : "No prior match analysis provided.";

    const prompt = `
You are an elite interview coach for software and professional roles (nextstepresume.ai style).
Generate tailored interview preparation based on the candidate resume, job description, and optional gap analysis.

Company: ${company}
Role: ${role}

Return strict JSON only:
{
  "jobTitle": "${role}",
  "companyName": "${company}",
  "focusAreas": ["3-5 areas to emphasize in interview"],
  "categories": [
    {
      "type": "technical" | "behavioral" | "company" | "role",
      "label": "Category display name",
      "questions": [
        {
          "question": "Likely interview question",
          "tips": "How to approach answering",
          "sampleAnswerOutline": "STAR or bullet outline using candidate's real experience"
        }
      ]
    }
  ],
  "preparationChecklist": ["5-7 actionable prep steps before the interview"]
}

Include at least 2 categories with 2-3 questions each. Ground answers in the resume.

Resume:
${resumeText}

Job Description:
${jobDescription}

Match / Gap Analysis:
${matchContext}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: withMarketWritingGuide(req, prompt),
      config: {
        responseMimeType: "application/json",
        systemInstruction:
          "You are an expert interview coach. Return raw JSON matching the schema exactly.",
        temperature: 0.35,
      },
    });

    const textOutput = response.text?.trim() || "{}";
    const result = parseAiJson(textOutput, () =>
      getSimulatedInterviewPrep(resumeData, jobDescription, company, role, matchAnalysis)
    );
    return res.json({ ...result, meta: { source: "gemini", simulated: false } });
  } catch (error: unknown) {
    console.error("Gemini interview prep error:", error);
    return res.status(500).json({
      error: "Failed to generate interview prep",
      fallback: getSimulatedInterviewPrep(
        resumeData,
        jobDescription,
        company,
        role,
        matchAnalysis
      ),
      meta: { source: "simulation", simulated: true },
    });
  }
});

// REST API for Company Research
  app.post("/api/company-research", async (req, res) => {
  const { jobDescription, companyName = "", jobTitle = "" } = req.body;

  if (!jobDescription || String(jobDescription).trim().length === 0) {
    return res.status(400).json({ error: "jobDescription is required" });
  }

  const company =
    companyName?.trim() ||
    jobDescription.match(/at\s+([A-Z][A-Za-z0-9\s.&]{2,30})/)?.[1]?.trim() ||
    "Target Company";
  const role = jobTitle?.trim() || "Target Role";

  if (!ai) {
    return res.json({
      ...getSimulatedCompanyResearch(jobDescription, company, role),
      meta: { source: "simulation", simulated: true },
    });
  }

  try {
    const prompt = `
You are a career research analyst helping candidates prepare for applications (nextstepresume.ai style).
Research the target company based on the job description context. If exact company facts are unknown, infer reasonable industry-standard insights and label uncertainties implicitly in neutral language.

Company: ${company}
Role: ${role}

Return strict JSON only:
{
  "companyName": "${company}",
  "overview": "2-3 sentence company overview",
  "mission": "Likely mission or value proposition",
  "products": ["2-4 products/services or focus areas"],
  "culture": ["3-5 culture signals from JD or industry norms"],
  "recentNews": ["2-3 plausible recent themes or initiatives to mention"],
  "interviewTips": ["3-5 company-specific interview tips"],
  "talkingPoints": ["4-6 talking points linking candidate interest to company"]
}

Job Description:
${jobDescription}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: withMarketWritingGuide(req, prompt),
      config: {
        responseMimeType: "application/json",
        systemInstruction:
          "You are a company research analyst for job seekers. Return raw JSON matching the schema.",
        temperature: 0.4,
      },
    });

    const textOutput = response.text?.trim() || "{}";
    const result = parseAiJson(textOutput, () =>
      getSimulatedCompanyResearch(jobDescription, company, role)
    );
    return res.json({ ...result, meta: { source: "gemini", simulated: false } });
  } catch (error: unknown) {
    console.error("Gemini company research error:", error);
    return res.status(500).json({
      error: "Failed to generate company research",
      fallback: getSimulatedCompanyResearch(jobDescription, company, role),
      meta: { source: "simulation", simulated: true },
    });
  }
});
}
