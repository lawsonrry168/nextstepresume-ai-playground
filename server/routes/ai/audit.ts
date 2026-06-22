import type { Express } from "express";
import type { GoogleGenAI } from "@google/genai";
import { parseAiJson, withMarketWritingGuide } from "../../lib/aiContext.ts";

import {
  getSimulatedAnalysis,
  getSimulatedGrammarTone,
  getSimulatedMatchAnalysis,
  getSimulatedReadability,
  getSimulatedSkillConsistency,
} from "../../simulation/engine.ts";

export function registerAiAuditRoutes(app: Express, ai: GoogleGenAI | null): void {
  app.post("/api/analyze", async (req, res) => {
  const { resumeData, jobDescription, intensity = "balanced" } = req.body;
  const tailorIntensity = intensity === "aggressive" ? "aggressive" : "balanced";

  if (!resumeData) {
    return res.status(400).json({ error: "resumeData is required" });
  }

  // If no AI available, provide an excellent simulated reverse-engineering analytical response
  if (!ai) {
    return res.json({
      ...getSimulatedAnalysis(resumeData, jobDescription, tailorIntensity),
      meta: { source: "simulation", simulated: true },
    });
  }

  try {
    const resumeText = typeof resumeData === "string" ? resumeData : JSON.stringify(resumeData, null, 2);
    const jdText = jobDescription || "General Professional ATS Resume Optimization";

    const intensityGuide =
      tailorIntensity === "aggressive"
        ? "Use AGGRESSIVE tailoring: maximize keyword density, rewrite ALL bullets with bold metrics (even estimated), and push atsScore adjustments toward stronger alignment."
        : "Use BALANCED tailoring: preserve factual tone, add metrics where reasonable, and avoid over-stuffing keywords.";

    const prompt = `
You are a highly advanced Applicant Tracking System (ATS), HR Recruiter, and Career Success AI specialized in reverse engineering premium resume optimizations like nextstepresume.ai.
Your objective is to analyze the user's resume, compare it to the target Job Description, score it, identify gaps, keywords, weak phrases, and provide tailormade summary and bullet points.

Tailoring intensity: ${tailorIntensity.toUpperCase()}
${intensityGuide}

Return a JSON object that adheres EXACTLY to this schema structure and no other text:
{
  "atsScore": number (0 to 100 representing percentage match),
  "categories": [
    { "name": "Keyword Alignment", "score": number (0-25), "max": 25, "feedback": "feedback string" },
    { "name": "Experience Impact", "score": number (0-25), "max": 25, "feedback": "feedback string" },
    { "name": "Format & ATS Scan", "score": number (0-25), "max": 25, "feedback": "feedback string" },
    { "name": "Skill Relevancy", "score": number (0-25), "max": 25, "feedback": "feedback string" }
  ],
  "keywords": [
    { "word": "string", "importance": "high" | "medium" | "low", "present": boolean }
  ],
  "weakPhrases": [
    { "original": "string", "replacement": "string", "reason": "string" }
  ],
  "tailoredSummary": "A highly premium tailored professional summary paragraph fitting the resume's history and targeted JD.",
  "tailoredBulletPoints": [
    { "experienceId": "string", "originalBullets": ["string"], "optimizedBullets": ["string"] }
  ]
}

Ensure the "keywords" array has at least 6 critical technical/skill terms from the Job Description. Indicate the ones present vs missing.
Ensure the "weakPhrases" lists 2-3 weak or cliché phrases in the resume with high-impact data-driven (STAR method) suggestions.
Ensure the "tailoredBulletPoints" optimizes work experience bullets for ALL experiences, replacing passive verbs with strong action verbs (e.g., 'managed' -> 'orchestrated', 'worked on' -> 'engineered') and adding quantifiable outcomes where appropriate.

Here is the user's Resume Data:
${resumeText}

Here is the target Job Description:
${jdText}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: withMarketWritingGuide(req, prompt),
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are an ATS compliance and Resume optimization expert. Return raw JSON matching the requested schema strictly.",
        temperature: 0.2,
      }
    });

    const textOutput = response.text?.trim() || "{}";
    const result = parseAiJson(textOutput, () => getSimulatedAnalysis(resumeData, jobDescription, tailorIntensity));
    return res.json({ ...result, meta: { source: "gemini", simulated: false } });
  } catch (error: unknown) {
    console.error("Gemini tailoring error:", error);
    return res.status(500).json({
      error: "Failed to generate AI Tailor response",
      fallback: getSimulatedAnalysis(resumeData, jobDescription, tailorIntensity),
      meta: { source: "simulation", simulated: true },
    });
  }
});

// REST API for Grammar and Tone checking
  app.post("/api/grammar-tone-check", async (req, res) => {
  const { resumeData } = req.body;

  if (!resumeData) {
    return res.status(400).json({ error: "resumeData is required" });
  }

  if (!ai) {
    return res.json({ ...getSimulatedGrammarTone(resumeData), meta: { source: "simulation", simulated: true } });
  }

  try {
    const resumeText = typeof resumeData === "string" ? resumeData : JSON.stringify(resumeData, null, 2);

    const prompt = `
You are an elite executive resume editor, grammar expert, and professional copywriter.
Analyze the following resume data for spelling mistakes, grammatical errors, active vs passive voice issues, formatting inconsistencies, and overall professional tone (it should be authoritative, result-oriented, and active).

Resume Data:
${resumeText}

Provide a comprehensive, detailed grammar and tone analysis. Return a JSON object matching this schema exactly, and no other text:
{
  "score": number (0 to 100 representing overall tone/grammar quality),
  "summary": "A concise professional assessment (2-3 sentences) of the resume's grammar, proofreading, and vocabulary clarity.",
  "suggestions": [
    {
      "section": "string representing section names: e.g., 'Summary', 'Experience: <Job Title>', etc.",
      "original": "The exact original sentence or bullet point that has room for improvement",
      "suggested": "The corrected, polished, high-impact version",
      "explanation": "Detailed explanation of why this update makes it superior (e.g., grammatical correction, active tone shift, clarity enhancement)",
      "severity": "high" | "medium" | "low"
    }
  ]
}

Ensure you scan the professional summary and ALL experience bullet points thoroughly! List up to 4-6 valuable, precise suggestions. Limit original and suggested properties to specific sentences or bullets, not entire pages, to make them easy to compare.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: withMarketWritingGuide(req, prompt),
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are an elite proofreader and resume consulting editor. Return raw JSON matching the requested schema strictly.",
        temperature: 0.3,
      }
    });

    const textOutput = response.text?.trim() || "{}";
    const result = parseAiJson(textOutput, () => getSimulatedGrammarTone(resumeData));
    return res.json({ ...result, meta: { source: "gemini", simulated: false } });
  } catch (error: unknown) {
    console.error("Gemini grammar checking error:", error);
    return res.status(500).json({
      error: "Failed to generate AI Grammar check response",
      fallback: getSimulatedGrammarTone(resumeData),
      meta: { source: "simulation", simulated: true },
    });
  }
});

// REST API for Readability and Complexity checking
  app.post("/api/readability-complexity", async (req, res) => {
  const { resumeData } = req.body;

  if (!resumeData) {
    return res.status(400).json({ error: "resumeData is required" });
  }

  if (!ai) {
    return res.json({ ...getSimulatedReadability(resumeData), meta: { source: "simulation", simulated: true } });
  }

  try {
    const resumeText = typeof resumeData === "string" ? resumeData : JSON.stringify(resumeData, null, 2);

    const prompt = `
You are an advanced Applicant Tracking System (ATS) algorithmic parser, readability consultant, and expert resume consultant.
Analyze the following resume data for readability, sentence structure complexity, and technical jargon/buzzword density. Keep in mind that heavy technical jargon and overly long complex sentences make resumes hard to parse for both ATS and human reviewers.

Resume Data:
${resumeText}

Provide a detailed readability and complexity analysis. Return a JSON object matching this schema exactly, and no other text:
{
  "readabilityScore": number (0 to 100 representing Flesch-like readability ease, layout balance, and parser accessibility),
  "complexityLevel": "High" | "Medium" | "Low" (cognitive load level),
  "averageSentenceLength": number (estimated average word count per sentence/bullet point),
  "jargonDensity": number (percentage 0 to 100 of academic/corporate jargon, buzzwords, or ungrounded qualifiers),
  "summary": "A concise assessment (2-3 sentences) summarizing how easily an ATS parses the structures, the clarity of sentence lengths, and the buzzword density.",
  "suggestions": [
    {
      "section": "string representing section names: e.g., 'Summary', 'Experience: <Job Title>', etc.",
      "original": "The exact original complex or jargon-loaded statement that has room for simplification",
      "suggested": "The simplified, high-impact version that maintains target keywords but is significantly easier to parse",
      "reason": "Detailed explanation of why this style shift reduces reader cognitive load or improves parser regex matching",
      "type": "sentence_structure" | "jargon_reduction"
    }
  ]
}

Identify 3-5 specific, strong suggestions for simplifying sentence structures or reducing ungrounded jargon clauses. Ensure suggestions can be easily compared.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: withMarketWritingGuide(req, prompt),
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are an expert resume parsing readability consultant. Return raw JSON matching the requested schema strictly.",
        temperature: 0.3,
      }
    });

    const textOutput = response.text?.trim() || "{}";
    const result = parseAiJson(textOutput, () => getSimulatedReadability(resumeData));
    return res.json({ ...result, meta: { source: "gemini", simulated: false } });
  } catch (error: unknown) {
    console.error("Gemini readability checking error:", error);
    return res.status(500).json({
      error: "Failed to generate AI Readability check response",
      fallback: getSimulatedReadability(resumeData),
      meta: { source: "simulation", simulated: true },
    });
  }
});

// REST API for Skill-Job Consistency checking
  app.post("/api/skill-job-consistency", async (req, res) => {
  const { resumeData, jobDescription } = req.body;

  if (!resumeData) {
    return res.status(400).json({ error: "resumeData is required" });
  }

  if (!ai) {
    return res.json({ ...getSimulatedSkillConsistency(resumeData, jobDescription), meta: { source: "simulation", simulated: true } });
  }

  try {
    const title = resumeData.personalInfo?.title || "Staff Member";
    const skillsList = resumeData.skills || [];
    const resumeText = typeof resumeData === "string" ? resumeData : JSON.stringify(resumeData, null, 2);

    const prompt = `
You are an expert tech recruiter, ATS indexing algorithm debugger, and veteran resume taxonomist.
Your job is to analyze the relationship between the candidate's target job title "${title}" (and optional target job description context below) and their currently declared list of skills.

Current Listed Skills:
${JSON.stringify(skillsList, null, 2)}

Full Resume Details (for deep sector context, work history, or technology references):
${resumeText}

Target Job Description (for matching context if relevant):
${jobDescription || "None provided"}

Analyze any misalignment, missing standards, or outdated keywords, and return a single valid JSON object matching this schema exactly with no other conversational markdown wrappers:
{
  "consistencyScore": number (0 to 100 representing how well aligned, accurate, up-to-date, and strong the currently listed skills are for the target job title; if important required skills are completely missing for the target job title, decrease the score),
  "jobTitleAnalyzed": "${title}",
  "missingCrucialSkills": ["list 2-4 crucial skills that are industry-standard requirements or highly relevant for this specific role/title, but missing in this resume's skills list"],
  "redundantOrMismatchedSkills": ["list 1-3 skills that are highly outdated, generic buzzwords, or completely mismatched/irrelevant for this target role"],
  "issues": [
    {
      "skill": "Name of the mismatched, missing or weak skill",
      "severity": "critical" | "warning" | "info",
      "message": "Clear explanation of the mismatch, why it fails machine ATS checks, and the recommended integration approach."
    }
  ],
  "summary": "A concise, professional 2-3 sentence overview highlighting the alignment health of the candidate's skills taxonomy relative to the target career sector."
}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: withMarketWritingGuide(req, prompt),
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are an expert developer-recruitment resume auditor. Return raw JSON matching the requested schema strictly.",
        temperature: 0.3,
      }
    });

    const textOutput = response.text?.trim() || "{}";
    const result = parseAiJson(textOutput, () => getSimulatedSkillConsistency(resumeData, jobDescription));
    return res.json({ ...result, meta: { source: "gemini", simulated: false } });
  } catch (error: unknown) {
    console.error("Gemini skill consistency checking error:", error);
    return res.status(500).json({
      error: "Failed to generate AI Skill Consistency check response",
      fallback: getSimulatedSkillConsistency(resumeData, jobDescription),
      meta: { source: "simulation", simulated: true },
    });
  }
});

// REST API for AI Match Analysis & Gap Audit
  app.post("/api/match-analysis", async (req, res) => {
  const { resumeData, jobDescription } = req.body;

  if (!resumeData) {
    return res.status(400).json({ error: "resumeData is required" });
  }
  if (!jobDescription || jobDescription.trim().length === 0) {
    return res.status(400).json({ error: "jobDescription is required for matching" });
  }

  if (!ai) {
    return res.json({ ...getSimulatedMatchAnalysis(resumeData, jobDescription), meta: { source: "simulation", simulated: true } });
  }

  try {
    const resumeText = typeof resumeData === "string" ? resumeData : JSON.stringify(resumeData, null, 2);

    const prompt = `
You are an elite Applicant Tracking System (ATS) matching algorithm, Senior Recruiter, and Career Success Coach.
Your task is to perform an extensive 'Gap Analysis' and Match Audit comparing the candidate's Resume against their target Job Description (JD).

Resume Data:
${resumeText}

Target Job Description:
${jobDescription}

Perform a rigorous comparison. Assess technology fit, years of experience, chronological depth, industry-standard expectations, academic background, and quantifiable performance evidence (STAR-format achievements with metrics).
Identify precise strengths they have, exact professional or technical gaps (missing skills, certification mismatches, soft competency voids, layout details, lack of metrics), missing keywords, an overall match percentage score, and a 3-4 step Action Plan to bridge these gaps.

Return a response in strict JSON format matching this schema exactly, and no other text wrappers:
{
  "overallScore": number (0 to 100 representing overall suitability/match level based on requirements),
  "jobTitle": "Estimated / Extracted target job title from the job description",
  "companyName": "Extracted target company name, if declared, or default to empty string",
  "summary": "A high-quality 3-4 sentence professional evaluation of the candidate's alignment relative to this specific job description, explaining the match tier clearly.",
  "matchedStrengths": ["List 2-4 strong matching characteristics, competencies, or achievements the candidate already possesses that match the JD requirements perfectly"],
  "gaps": [
    {
      "area": "Specific technology, skill, section or metric block (e.g. 'Advanced Frontend Frameworks', 'STAR KPI metrics')",
      "type": "skills" | "experience" | "education" | "credentials",
      "severity": "high" | "medium" | "low",
      "description": "Clear explanation of what is missing or weak compared to standard requirements",
      "recommendation": "Step-by-step guidance on how to fix this gap in their resume details"
    }
  ],
  "missingKeywords": ["List 3-6 critical keywords, technology names, or domain terminology present in the job description but missing/unacknowledged in the candidate's resume"],
  "actionPlan": ["3-4 clear, actionable, specific instructions on what edits we highly advise the candidate to execute right now to elevate their match score"]
}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: withMarketWritingGuide(req, prompt),
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are an expert resume developer and recruiter. Output raw JSON matching the exact schema specified.",
        temperature: 0.3,
      }
    });

    const textOutput = response.text?.trim() || "{}";
    const result = parseAiJson(textOutput, () => getSimulatedMatchAnalysis(resumeData, jobDescription));
    return res.json({ ...result, meta: { source: "gemini", simulated: false } });
  } catch (error: unknown) {
    console.error("Gemini Match Analysis call failed:", error);
    return res.status(500).json({
      error: "Failed to generate AI Match analysis response",
      fallback: getSimulatedMatchAnalysis(resumeData, jobDescription),
      meta: { source: "simulation", simulated: true },
    });
  }
});
}
