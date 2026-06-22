import express from "express";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { parseResumeText } from "./src/lib/resumeTextParser.ts";
import { extractJdKeywords } from "./src/lib/atsKeywords.ts";
import { extractTextFromPdfBuffer } from "./src/lib/pdfExtract.ts";
import { getAiWritingGuide } from "./src/lib/market/aiWritingGuide.ts";
import { rateLimit } from "./server/middleware/rateLimit.ts";
import { subscriptionQuota } from "./server/middleware/subscriptionQuota.ts";
import { registerCoreRoutes } from "./server/routes/index.ts";

dotenv.config();

function withMarketWritingGuide(req: express.Request, prompt: string): string {
  return `${prompt.trim()}\n\n${getAiWritingGuide({ locale: req.header("X-Locale") ?? undefined })}`;
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JSON_BODY_LIMIT = "1mb";

app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use("/api", rateLimit);
app.use("/api", subscriptionQuota);

function contentHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function deterministicRange(seed: string, min: number, max: number): number {
  const range = max - min + 1;
  return min + (contentHash(seed) % range);
}

function deterministicPresent(seed: string): boolean {
  return (contentHash(seed) % 2) === 0;
}

function parseAiJson<T extends object>(text: string, fallback: () => T): T {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Invalid JSON shape");
    }
    return parsed as T;
  } catch {
    return fallback();
  }
}

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb: multer.FileFilterCallback) => {
    const isPdf =
      file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
    if (isPdf) cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});

// Initialize Gemini SDK with telemetry User-Agent header
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("✅ Gemini API initialized successfully on server-side.");
  } catch (err) {
    console.error("❌ Failed to instantiate GoogleGenAI client:", err);
  }
} else {
  console.log("⚠️ No GEMINI_API_KEY found or default placeholder detected. Server running with simulation engine fallback.");
}

// REST API for Resume Analysis & Tailoring
registerCoreRoutes(app, !!ai);

// Parse pasted resume text into structured ResumeData (mirrors nextstepresume.ai /api/resume/parse)
app.post("/api/resume/parse", (req, res) => {
  const { text, resumeData } = req.body;

  if (resumeData && typeof resumeData === "object") {
    return res.json({
      success: true,
      resumeData,
      meta: { source: "parser", simulated: false },
    });
  }

  if (!text || typeof text !== "string" || text.trim().length < 20) {
    return res.status(400).json({ error: "text is required (min 20 characters) or provide resumeData" });
  }

  try {
    const parsed = parseResumeText(text);
    return res.json({
      success: true,
      resumeData: parsed,
      meta: { source: "parser", simulated: false },
    });
  } catch (err: unknown) {
    console.error("Resume parse error:", err);
    return res.status(422).json({ error: "Could not parse resume text. Try clearer section headers (SUMMARY, EXPERIENCE, SKILLS)." });
  }
});

// Parse uploaded PDF resume into structured ResumeData
app.post("/api/resume/parse-pdf", pdfUpload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "PDF file is required (form field: file)" });
  }

  try {
    const text = await extractTextFromPdfBuffer(req.file.buffer);
    if (!text || text.length < 20) {
      return res.status(422).json({
        error: "PDF contains insufficient extractable text. Use a text-based PDF or paste content manually.",
      });
    }

    const parsed = parseResumeText(text);
    return res.json({
      success: true,
      resumeData: parsed,
      extractedTextLength: text.length,
      meta: { source: "parser", simulated: false },
    });
  } catch (err: unknown) {
    console.error("PDF parse error:", err);
    const message = err instanceof Error ? err.message : "Failed to parse PDF resume";
    return res.status(422).json({ error: message });
  }
});

// Extract JD keywords for client-side ATS preview alignment
app.post("/api/jd/extract-keywords", (req, res) => {
  const { jobDescription } = req.body;
  if (!jobDescription || typeof jobDescription !== "string") {
    return res.status(400).json({ error: "jobDescription is required" });
  }
  const keywords = extractJdKeywords(jobDescription);
  return res.json({ keywords, meta: { source: "parser", simulated: false } });
});

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

// High quality simulated readability and complexity checker
function getSimulatedReadability(resumeData: any): any {
  const isString = typeof resumeData === "string";
  const experienceList = isString ? [] : (resumeData.experience || []);
  const title = isString ? "Software Engineer" : (resumeData.personalInfo?.title || "Professional");

  const suggestions: any[] = [
    {
      section: "Professional Summary",
      original: isString 
        ? "Dynamic leader looking to leverage bleeding-edge paradigms to synergize scalable systems." 
        : (resumeData.summary?.substring(0, 75) || "A passionate Engineer with experience..."),
      suggested: `Results-oriented ${title} with a track record of driving scalable system efficiency and collaborative growth.`,
      reason: "Replaces empty corporate buzzwords ('leveraging bleeding-edge paradigms to synergize') with direct, professional action descriptors.",
      type: "jargon_reduction" as const
    }
  ];

  if (experienceList.length > 0) {
    const mainJob = experienceList[0];
    const mainTitle = mainJob.role || "Developer";
    const firstBullet = (mainJob.bullets && mainJob.bullets[0]) || "Helped build features for the website.";
    
    suggestions.push({
      section: `Experience: ${mainTitle}`,
      original: firstBullet,
      suggested: `Engineered high-performance web components utilizing React and TypeScript, accelerating site loading speed by 25%.`,
      reason: "Simplifies sentence pacing and structure while maintaining vital technical keywords and clear STAR-model metrics.",
      type: "sentence_structure" as const
    });

    if (mainJob.bullets && mainJob.bullets.length > 1) {
      suggestions.push({
        section: `Experience: ${mainTitle}`,
        original: mainJob.bullets[1],
        suggested: `Optimized database API routing parameters to improve system latency performance by 30%.`,
        reason: "Eliminates redundant technical filler terminology, increasing Flesch scanning velocity for AI indices.",
        type: "jargon_reduction" as const
      });
    }
  }

  return {
    readabilityScore: 78,
    complexityLevel: "Medium" as const,
    averageSentenceLength: 15,
    jargonDensity: 14,
    summary: `Your resume demonstrates good structure with a readable sentence average of 15 words per bullet. However, your professional summary contains passive corporate fillers which can easily be simplified for optimal ATS scanning and lower human reviewer fatigue.`,
    suggestions
  };
}


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

// REST API for Talk / Ask Gemini Toolbar
app.post("/api/ask-gemini", async (req, res) => {
  const { message, resumeData, jobDescription, history = [], thinkingMode = false } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  if (!ai) {
    const reply = getSimulatedGeminiReply(message, resumeData, jobDescription);
    return res.json({ reply, meta: { source: "simulation", simulated: true } });
  }

  try {
    const resumeText = typeof resumeData === "string" ? resumeData : JSON.stringify(resumeData, null, 2);
    const jdText = jobDescription || "Not provided";

    // Build conversation context
    const preamble = `You are NextStepResume.ai's Elite Career Coach, ATS optimiser, and Expert Resume Editor.
Your job is to answer candidates' questions with brilliant, precise, highly actionable, and professional advising.
Always provide concrete advice, specific keywords, or bullet point rewrites using the STAR methodology (Situation, Task, Action, Result) when asked.
Keep answers concise, scannable (with bold text or bullet points), and highly encouraging!

Here is the candidate's Resume Profile:
${resumeText}

Here is the Target Job Description:
${jdText}
`;

    // Process chat history if any
    const chatContents = [
      { text: preamble },
      ...history.map((msg: any) => ({
        text: `${msg.role === 'user' ? 'Candidate' : 'Assistant'}: ${msg.content}`
      })),
      { text: `Candidate Question: ${message}\n\nPlease response directly and professionally as their elite Career Coach:` }
    ];

    const finalModel = thinkingMode ? "gemini-3.1-pro-preview" : "gemini-3.5-flash";
    const finalConfig: any = {
      systemInstruction: `You are an elite career development strategist for Hong Kong job seekers. Give realistic, professional, highly actionable guidance.\n\n${getAiWritingGuide({ locale: req.header("X-Locale") ?? undefined })}`,
      temperature: thinkingMode ? 0.7 : 0.7,
    };

    if (thinkingMode) {
      finalConfig.thinkingConfig = {
        thinkingLevel: ThinkingLevel.HIGH
      };
    }

    const response = await ai.models.generateContent({
      model: finalModel,
      contents: chatContents.map(c => c.text).join("\n\n"),
      config: finalConfig
    });

    const reply = response.text || "I was unable to analyze your request. Please try rephrasing.";
    return res.json({ reply, meta: { source: "gemini", simulated: false } });
  } catch (error: unknown) {
    console.error("Gemini chatbot error:", error);
    return res.status(500).json({
      error: "Failed to reach Gemini Career Advisor core",
      reply: getSimulatedGeminiReply(message, resumeData, jobDescription),
      meta: { source: "simulation", simulated: true },
    });
  }
});

// Simulated Intelligent Conversational Advisor
function getSimulatedGeminiReply(message: string, resumeData: any, jobDescription: string): string {
  const msgLower = message.toLowerCase();
  const title = resumeData?.personalInfo?.title || "Professional Developer";
  const name = resumeData?.personalInfo?.name || "Candidate";

  if (msgLower.includes("hello") || msgLower.includes("hi ") || msgLower.includes("greet")) {
    return `Hello **${name}**! 👋 I'm your integrated AI Career Advisor.\n\nI have indexed your resume as a **${title}** and analyzed your match options. How can I help you optimize your resume today? You can ask me to:
- **"Rewrite my summary for this job"**
- **"What skills am I missing?"**
- **"How can I emphasize React inside my bullets?"**`;
  }

  if (msgLower.includes("summary") || msgLower.includes("profile") || msgLower.includes("intro")) {
    return `### 💡 Optimized Professional Summary for You:
"Dynamic, performance-driven **${title}** with proven experience engineering high-performance systems and managing full-cycle software deployments. Highly skilled in leveraging robust technologies to streamline workflow throughput and implement clean, modular, ATS-optimized code. Adept at driving STAR model impacts which result in recorded scalability enhancements."

**Why this works:**
1. Avoids passive phrases like *"Responsible for"* or *"Looking for"*.
2. Elevates technical keywords directly into first-scan focus.
3. Hints at quantifiable business results which catch recruiters' eyes in < 6 seconds!`;
  }

  if (msgLower.includes("skill") || msgLower.includes("missing") || msgLower.includes("gap") || msgLower.includes("keyword")) {
    const jdTech = [];
    if (jobDescription) {
      const terms = ["react", "typescript", "node.js", "next.js", "aws", "docker", "python", "kubernetes", "tailwind", "sql"];
      terms.forEach(t => {
        if (jobDescription.toLowerCase().includes(t)) {
          jdTech.push(t.toUpperCase());
        }
      });
    }
    const displayMissing = jdTech.length > 0 ? jdTech.join(", ") : "TypeScript, Kubernetes, and CI/CD Pipelines";
    return `### 🎯 Technical Keyword Analysis & Optimization:

Recruiting algorithms scanned your profile compared to the job description expectations. Here is how to close the gaps:

1. **Missing Domain Skills:** You should officially list **${displayMissing}** in your Technical Skills ledger.
2. **Contextual Proofing:** Don't just list them in the skills box—integrate them into your employment accomplishments:
   - *Instead of:* "Maintained existing applications."
   - *Write:* "Engineered robust code refactors using **TypeScript**, reducing frontend runtime latency margins by 18%."

Would you like me to rewrite a specific experience bullet to fit these standards?`;
  }

  if (msgLower.includes("rewrite") || msgLower.includes("bullet") || msgLower.includes("experience") || msgLower.includes("work")) {
    return `### 📝 Custom STAR-method Bullet Point Rewrite:

Here is how we can transform a standard passive bullet point into a high-impact, professional, data-driven achievement:

*   **Passive / Low-Agency (Before):**
    > *"Helped design components and fixed website performance bugs."*
*   **Active / Metric-Enriched (After):**
    > **"Architected scale-resilient modular components using React and TypeScript, accelerating DOM paint speed by 28% and resolving critical performance bottlenecks."**

**Benefits of this update:**
- Shift from passive action (*"helped"*, *"worked on"*) to premium impact verb (*"Architected"*, *"Optimized"*).
- Incorporates exact technology attributes to satisfy the ATS criteria.
- Outlines clear business metrics (paint speed percentiles) that humans respect.`;
  }

  // Default helpful career advisor response
  return `### 💡 Advice for your request regarding: "${message}"

Thank you for asking! As your career coach, here are 3 immediate guidelines to raise your profile as a **${title}**:

1. **Assertive Verb Framing:** Replace verbs like *"managed"* with high-agency verbs like *"orchestrated"*, *"spearheaded"*, or *"conceptualized"*.
2. **Quantifiably STAR Proofing:** Always associate your development bullet entries with structured, estimated improvements (e.g. latency reduced, pipeline throughput, client ticket delivery).
3. **Keyword Density Matrix:** Align technical frameworks to matches directly within your experience narrative.

Would you like me to tailor any specific section, suggest custom certification updates, or draft a cover letter outline for this job description?`;
}

// High quality simulated match analyzer fallbacks
function getSimulatedMatchAnalysis(resumeData: any, jobDescription: string): any {
  const isString = typeof resumeData === "string";
  const title = isString ? "Software Engineer" : (resumeData.personalInfo?.title || "Professional").trim();
  const skillsList: string[] = isString ? [] : (resumeData.skills || []);

  const jd = jobDescription || "";
  const jdLower = jd.toLowerCase();

  // Basic parsing of JD to find job title
  let jobTitle = title;
  const titleMatch = jd.match(/(?:title|role|position):\s*([^\n]+)/i) || jd.match(/(?:looking for a|seeking a)\s+([A-Za-z0-9\s-]{3,40})/i);
  if (titleMatch && titleMatch[1]) {
    jobTitle = titleMatch[1].trim();
  } else {
    if (jdLower.includes("product manager")) jobTitle = "Product Manager";
    else if (jdLower.includes("frontend engineer") || jdLower.includes("frontend developer")) jobTitle = "Frontend Engineer";
    else if (jdLower.includes("backend engineer") || jdLower.includes("backend developer")) jobTitle = "Backend Engineer";
    else if (jdLower.includes("full stack") || jdLower.includes("fullstack")) jobTitle = "Full-Stack Software Engineer";
    else if (jdLower.includes("data scientist") || jdLower.includes("data analyst")) jobTitle = "Data Scientist";
  }

  let matchScore = 72;
  const matchedStrengths: string[] = [];
  const gaps: any[] = [];
  const missingKeywords: string[] = [];
  const actionPlan: string[] = [];

  const skillsLower = skillsList.map(s => s.toLowerCase());
  const standardTechTerms = ["react", "typescript", "node.js", "next.js", "docker", "kubernetes", "aws", "python", "sql", "graphql", "tailwind", "express"];
  const jdTechKeywords: string[] = [];
  standardTechTerms.forEach(term => {
    if (jdLower.includes(term)) {
      jdTechKeywords.push(term);
    }
  });

  const matchedTech = jdTechKeywords.filter(k => skillsLower.some(s => s.includes(k)));
  const unmatchedTech = jdTechKeywords.filter(k => !skillsLower.some(s => s.includes(k)));

  if (matchedTech.length > 0) {
    matchedStrengths.push(`Direct alignment on core technology assets including: ${matchedTech.map(t => t.toUpperCase()).join(", ")}`);
    matchScore += matchedTech.length * 4;
  } else {
    matchedStrengths.push("Possesses cross-functional foundational technical competency that transfers well across platforms.");
  }

  if (unmatchedTech.length > 0) {
    unmatchedTech.forEach(term => {
      missingKeywords.push(term.charAt(0).toUpperCase() + term.slice(1));
    });
    gaps.push({
      area: "Core Technologies",
      type: "skills",
      severity: unmatchedTech.length > 3 ? "high" : "medium",
      description: `Target role specifies deep proficiency in ${unmatchedTech.map(t => t.toUpperCase()).join(", ")}, which are currently missing on your resume skills profile.`,
      recommendation: `Incorporate technical descriptors for ${unmatchedTech.slice(0, 3).map(t => t.toUpperCase()).join(", ")} directly into your skills ledger and work history bullets.`
    });
  }

  const expList = isString ? [] : (resumeData.experience || []);
  if (expList.length < 2) {
    gaps.push({
      area: "Professional History Density",
      type: "experience",
      severity: "high",
      description: "The job requirements highlight Senior/Staff levels of accountability. Your profile contains fewer than 2 distinct work experience ledger items.",
      recommendation: "Flesh out previous consulting, freelance, or junior projects to demonstrate professional duration and career progression."
    });
    matchScore -= 15;
  } else {
    matchedStrengths.push(`Strong career duration depth with ${expList.length} distinct professional engagements in senior/mid technical capacities.`);
  }

  let hasMetrics = false;
  expList.forEach((exp: any) => {
    if (exp.bullets) {
      exp.bullets.forEach((b: string) => {
        if (/\b\d+%\b|\b\d+\s*(?:percent|million|usd|developers|users|kpi|mil)\b/i.test(b)) {
          hasMetrics = true;
        }
      });
    }
  });

  if (hasMetrics) {
    matchedStrengths.push("Uses high-agency, metric-driven achievements (STAR method format) demonstrating business impact.");
  } else {
    gaps.push({
      area: "Performance Metrics & KPIs",
      type: "experience",
      severity: "medium",
      description: "The target job values performance optimization. Currently, your career bullets describe static duties rather than dynamic, quantified business impacts.",
      recommendation: "Rework work history bullet statements to include specific metrics (revenue growth, render efficiency, deployment speed or payload reduction percentiles)."
    });
    matchScore -= 8;
  }

  const eduList = isString ? [] : (resumeData.education || []);
  const hasCS = eduList.some((e: any) => e.field && /computer|science|engineering|tech/i.test(e.field));
  if (jdLower.includes("degree") || jdLower.includes("bachelor") || jdLower.includes("b.s") || jdLower.includes("computer science")) {
    if (eduList.length === 0) {
      gaps.push({
        area: "Academic Credentials",
        type: "education",
        severity: "high",
        description: "The targeted role strictly lists a higher-education degree (B.S./M.S. in Computer Science or related) as preferred, but your profile lacks an Academic Background section.",
        recommendation: "Ensure your primary degrees, diplomas, or bootcamp professional certifications are listed with proper major fields."
      });
      matchScore -= 12;
    } else if (!hasCS) {
      gaps.push({
        area: "Formal STEM Alignment",
        type: "education",
        severity: "low",
        description: "Your academic degree is in a non-traditional STEM field. While industry experience makes up for this, ATS machines prioritize explicit technical degrees.",
        recommendation: "Relocate your skills list to the absolute top of the page index to distract algorithms, emphasizing skills over formal majors."
      });
      matchScore -= 4;
    } else {
      matchedStrengths.push("Direct academic alignment with a formal degree listed in Computer Science / Engineering.");
    }
  }

  actionPlan.push(`Integrate the missing key tech terms (${missingKeywords.slice(0, 3).join(", ") || "TypeScript, Next.js, Docker"}) into your skills ledger.`);
  actionPlan.push("Convert at least 3 career bullet points from passive statements to metric-enriched STAR metrics.");
  actionPlan.push("Optimize the Professional Summary paragraph to target specific pain points mentioned in the JD.");

  matchScore = Math.max(40, Math.min(98, matchScore));

  return {
    overallScore: matchScore,
    jobTitle,
    companyName: jd.match(/at\s+([A-Z][A-Za-z0-9\s.]{1,20})/)?.[1]?.trim() || undefined,
    summary: `Your resume matches ${matchScore}% of the requirements listed in the job description. While you possess direct technical mastery in several core sectors, resolving the highlighted gaps around ${missingKeywords.slice(0, 2).join(" and ") || "industry terms"} and integrating quantified metric achievements will dramatically elevate your interview match probability.`,
    matchedStrengths,
    gaps,
    missingKeywords,
    actionPlan
  };
}

// High quality simulated skill consistency checker
function getSimulatedSkillConsistency(resumeData: any, jobDescription: string): any {
  const isString = typeof resumeData === "string";
  const title = isString ? "Software Engineer" : (resumeData.personalInfo?.title || "Professional").trim();
  const skillsList: string[] = isString ? [] : (resumeData.skills || []);
  
  const titleLower = title.toLowerCase();
  const skillsLower = skillsList.map(s => s.toLowerCase());

  let consistencyScore = 88;
  const missingCrucialSkills: string[] = [];
  const redundantOrMismatchedSkills: string[] = [];
  const issues: any[] = [];

  if (titleLower.includes("engineer") || titleLower.includes("developer") || titleLower.includes("programmer") || titleLower.includes("architect")) {
    const mustHaves = titleLower.includes("frontend") || titleLower.includes("web")
      ? ["React", "TypeScript", "Tailwind CSS", "Next.js"]
      : titleLower.includes("backend")
      ? ["Node.js", "PostgreSQL", "Docker", "REST APIs"]
      : ["Git", "Docker", "TypeScript", "CI/CD"];

    mustHaves.forEach(skill => {
      if (!skillsLower.some(s => s.includes(skill.toLowerCase()))) {
        missingCrucialSkills.push(skill);
      }
    });

    const genericSkills = ["microsoft office", "word", "excel", "powerpoint", "typing"];
    skillsList.forEach(s => {
      if (genericSkills.includes(s.toLowerCase())) {
        redundantOrMismatchedSkills.push(s);
        issues.push({
          skill: s,
          severity: "warning",
          message: `Listed skill "${s}" is considered too basic for an Engineering title "${title}". Consider removing it to save valuable resume real estate.`
        });
      }
    });

    if (missingCrucialSkills.length > 0) {
      consistencyScore -= (missingCrucialSkills.length * 10);
      issues.push({
        skill: missingCrucialSkills[0],
        severity: "critical",
        message: `Missing key tool: "${missingCrucialSkills[0]}" is a fundamental expectation for contemporary "${title}" roles.`
      });
    }
  } else if (titleLower.includes("manager") || titleLower.includes("product") || titleLower.includes("lead")) {
    const mustHaves = ["Agile Methodology", "Product Roadmap", "Scrum", "SQL", "Jira"];
    mustHaves.forEach(skill => {
      if (!skillsLower.some(s => s.includes(skill.toLowerCase()))) {
        missingCrucialSkills.push(skill);
      }
    });

    if (missingCrucialSkills.length > 0) {
      consistencyScore -= (missingCrucialSkills.length * 8);
      issues.push({
        skill: missingCrucialSkills[0],
        severity: "warning",
        message: `Strategic competence missing: Target role candidates heavily rely on "${missingCrucialSkills[0]}" for successful cross-team execution.`
      });
    }
  } else {
    if (!skillsLower.some(s => s.includes("communication") || s.includes("leadership") || s.includes("project management") || s.includes("strategic"))) {
      missingCrucialSkills.push("Project Management");
      missingCrucialSkills.push("Strategic Alignment");
      consistencyScore -= 12;
      issues.push({
        skill: "Project Management",
        severity: "info",
        message: "Consider adding core soft competencies like Strategic Project Management to reinforce senior professional authority."
      });
    }
  }

  consistencyScore = Math.max(35, Math.min(100, consistencyScore));

  const level = consistencyScore >= 80 ? "outstanding" : consistencyScore >= 60 ? "moderate" : "deficient";
  const summary = `Your listed skills demonstrate ${level} alignment in industry standard taxonomy for a "${title}" profile. We detected ${missingCrucialSkills.length} missing industry standard skillsets and successfully audited your skills metadata against the core requirements.`;

  return {
    consistencyScore,
    jobTitleAnalyzed: title,
    missingCrucialSkills,
    redundantOrMismatchedSkills,
    issues,
    summary
  };
}


// High quality simulated grammar and tone checker
function getSimulatedGrammarTone(resumeData: any): any {
  const isString = typeof resumeData === "string";
  const experienceList = isString ? [] : (resumeData.experience || []);
  const currentTitle = isString ? "Software Engineer" : (resumeData.personalInfo?.title || "Professional");

  const fallbackSuggestions: any[] = [
    {
      section: "Professional Summary",
      original: isString ? "I am looking for a job" : (resumeData.summary?.substring(0, 75) || "A passionate Engineer with experience..."),
      suggested: `Results-driven ${currentTitle} with a documented history of engineering premium web systems and accelerating deployment velocity.`,
      explanation: "Shifts the emphasis from basic desire to high-impact achievements. Replaced generic claims with robust metrics-ready phrases.",
      severity: "medium" as const
    }
  ];

  if (experienceList.length > 0) {
    const mainJob = experienceList[0];
    const mainTitle = mainJob.role || "Developer";
    const firstBullet = (mainJob.bullets && mainJob.bullets[0]) || "Helped build features for the website.";
    
    fallbackSuggestions.push({
      section: `Experience: ${mainTitle}`,
      original: firstBullet,
      suggested: `Architected high-performance responsive components using typescript and modern React, increasing workflow throughput by 22%.`,
      explanation: "Converted low-agency verb ('helped build') to an assertive engineering term ('architected') and specified standard stack tooling with a KPI marker.",
      severity: "high" as const
    });

    if (mainJob.bullets && mainJob.bullets.length > 1) {
      fallbackSuggestions.push({
        section: `Experience: ${mainTitle}`,
        original: mainJob.bullets[1],
        suggested: `Orchestrated diagnostic debug audits, reducing average latency bottlenecks by 31% across API gateway routes.`,
        explanation: "Action-oriented phrasing emphasizing proactive problem resolution and measurable performance gains.",
        severity: "low" as const
      });
    }
  }

  return {
    score: 82,
    summary: `The resume for ${isString ? "Applicant" : (resumeData.personalInfo?.name || "Jane Doe")} possesses modern technical coordinates, but would benefit from a proactive tense alignment. Several segments lean on non-committal support keywords ('worked on', 'helped') rather than direct executive action indicators.`,
    suggestions: fallbackSuggestions
  };
}

// High quality localized simulated response generator
function getSimulatedAnalysis(resumeData: any, jobDescription: string, intensity: "balanced" | "aggressive" = "balanced"): any {
  const isString = typeof resumeData === "string";
  const name = isString ? "Professional Applicant" : (resumeData.personalInfo?.name || "Jane Doe");
  const currentTitle = isString ? "Software Engineer" : (resumeData.personalInfo?.title || "Professional");
  
  const seedBase = `${name}|${currentTitle}|${jobDescription || ""}`;

  // Custom keyword generation based on JD or default
  const targetKeywords = [
    { word: "ATS Optimization", importance: "high", present: true },
    { word: "STAR Method Metrics", importance: "high", present: false },
    { word: "Full-Stack Development", importance: "high", present: true },
    { word: "System Architecture", importance: "medium", present: false },
    { word: "TypeScript & React", importance: "high", present: true },
    { word: "Cloud Deployment", importance: "medium", present: true },
    { word: "Quantitative Results", importance: "high", present: false },
    { word: "Enterprise Architecture", importance: "low", present: false }
  ];

  if (jobDescription && jobDescription.length > 5) {
    const jdWords = jobDescription.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const uniqueWords = Array.from(new Set(jdWords)).slice(0, 8);
    uniqueWords.forEach((word, idx) => {
      if (idx < targetKeywords.length) {
        targetKeywords[idx].word = word.charAt(0).toUpperCase() + word.slice(1);
        targetKeywords[idx].present = deterministicPresent(`${seedBase}|keyword|${word}`);
      }
    });
  }

  const score1 = deterministicRange(`${seedBase}|cat1`, intensity === "aggressive" ? 14 : 12, intensity === "aggressive" ? 18 : 16);
  const score2 = deterministicRange(`${seedBase}|cat2`, intensity === "aggressive" ? 12 : 10, intensity === "aggressive" ? 16 : 14);
  const score3 = deterministicRange(`${seedBase}|cat3`, intensity === "aggressive" ? 16 : 14, intensity === "aggressive" ? 20 : 18);
  const score4 = deterministicRange(`${seedBase}|cat4`, intensity === "aggressive" ? 13 : 11, intensity === "aggressive" ? 17 : 15);
  const totalScore = Math.min(98, score1 + score2 + score3 + score4);

  const experienceList = isString ? [] : (resumeData.experience || []);
  const tailoredBullets = experienceList.map((exp: any) => {
    const originalBullets = exp.bullets || ["Responsible for coding and fixing bugs.", "Helped design components."];
    const optimized = originalBullets.map((b: string) => {
      if (b.includes("Responsible for") || b.includes("Worked on") || b.includes("Helped")) {
        return intensity === "aggressive"
          ? `Spearheaded enterprise-scale architecture initiatives, accelerating deployment pipeline velocity by 38% via Docker/Kubernetes orchestration.`
          : `Orchestrated scale-resilient architecture, accelerating deployment pipeline velocity by 34% using Docker container workflows.`;
      }
      return intensity === "aggressive"
        ? `Engineered metric-driven state handlers; boosted rendering KPIs by 45% through React virtualization and TypeScript strict-mode refactors.`
        : `Engineered metric-driven state-management handlers; enhanced rendering KPIs by 42% through aggressive React virtual list optimization.`;
    });
    return {
      experienceId: exp.id || "1",
      originalBullets,
      optimizedBullets: optimized
    };
  });

  return {
    atsScore: totalScore,
    categories: [
      { name: "Keyword Alignment", score: score1, max: 25, feedback: "Several key technical terms from the JD match your engineering background. Adding explicit metric-driven phrases will bridge remaining holes." },
      { name: "Experience Impact", score: score2, max: 25, feedback: "Work experience statements lack sufficient numerical data. Shift bullets from standard responsibilities to quantitative STAR-format achievements." },
      { name: "Format & ATS Scan", score: score3, max: 25, feedback: "Excellent parsing eligibility. Clean headings and simplified modular dividers ensure faultless modern ATS machine readings." },
      { name: "Skill Relevancy", score: score4, max: 25, feedback: "Skills listed are solid but we recommend re-ordering high importance technologies such as Tailwind CSS near the top of the category." }
    ],
    keywords: targetKeywords,
    weakPhrases: [
      { original: "Responsible for managing products", replacement: "Spearheaded lifecycle execution of 3 product pipelines", reason: "Avoid passive ownership markers. Show leadership, numeric achievements, and quantifiable business scale." },
      { original: "Helped team build features", replacement: "Architected modern modular components with full TypeScript typing", reason: "Strengthen low-agency claims like 'helped' with affirmative developer traits like 'architected' or 'engineered'." }
    ],
    tailoredSummary: `Premium, tech-resilient ${currentTitle} with a documented history of driving user engagement up by 25% and delivering high-quality, ATS-scanned products. Leverages profound systems mastery (TypeScript, React, Cloud Environments) to optimize application delivery, establish unified team protocols, and convert business requirements into optimized, low-latency software assets.`,
    tailoredBulletPoints: tailoredBullets
  };
}

function getSimulatedCoverLetter(
  resumeData: unknown,
  jobDescription: string,
  companyName?: string,
  jobTitle?: string,
  tone: "professional" | "enthusiastic" | "concise" = "professional"
): {
  salutation: string;
  opening: string;
  bodyParagraphs: string[];
  closing: string;
  signature: string;
  fullText: string;
  tone: "professional" | "enthusiastic" | "concise";
} {
  const isString = typeof resumeData === "string";
  const data = isString ? null : (resumeData as Record<string, unknown>);
  const personalInfo = (data?.personalInfo as Record<string, string>) || {};
  const name = personalInfo.name || "Alex Mercer";
  const currentTitle = jobTitle || personalInfo.title || "Software Engineer";
  const company =
    companyName?.trim() ||
    jobDescription.match(/at\s+([A-Z][A-Za-z0-9\s.&]{2,30})/)?.[1]?.trim() ||
    "your organization";

  const salutation = companyName ? `Dear ${company} Hiring Team,` : "Dear Hiring Manager,";

  const opening =
    tone === "enthusiastic"
      ? `I am excited to apply for the ${currentTitle} role at ${company}. Your team's focus on high-impact engineering aligns perfectly with the measurable outcomes I have delivered throughout my career.`
      : tone === "concise"
      ? `I am applying for the ${currentTitle} position at ${company}. My background maps directly to your core requirements.`
      : `I am writing to express my interest in the ${currentTitle} position at ${company}. With a track record of delivering scalable, user-focused solutions, I am confident I can contribute meaningfully to your team from day one.`;

  const body1 =
    tone === "concise"
      ? `My experience includes building production-grade applications, collaborating with cross-functional stakeholders, and translating business goals into shippable features with measurable impact.`
      : `In my recent roles, I have engineered modern web applications, optimized performance-critical workflows, and partnered with product and design teams to ship features that improve engagement and reliability. The responsibilities outlined in your job description closely mirror the strengths I have demonstrated—particularly in technical execution, ownership, and outcome-driven delivery.`;

  const body2 =
    tone === "enthusiastic"
      ? `What draws me most to ${company} is the opportunity to solve meaningful problems at scale while continuing to grow as a builder. I would love to bring my energy, craftsmanship, and collaborative mindset to your team.`
      : `I am particularly interested in this opportunity because of ${company}'s reputation for thoughtful product development. I would welcome the chance to discuss how my skills can support your immediate roadmap and longer-term engineering goals.`;

  const closing =
    tone === "concise"
      ? `Thank you for your time. I am available for an interview at your convenience.`
      : `Thank you for considering my application. I look forward to the opportunity to discuss how my experience can support ${company}'s objectives, and I am available for an interview at your convenience.`;

  const signature = `Sincerely,\n${name}`;
  const fullText = [salutation, "", opening, "", body1, "", body2, "", closing, "", signature].join(
    "\n"
  );

  return {
    salutation,
    opening,
    bodyParagraphs: [body1, body2],
    closing,
    signature,
    fullText,
    tone,
  };
}

function getSimulatedInterviewPrep(
  resumeData: unknown,
  jobDescription: string,
  companyName: string,
  jobTitle: string,
  matchAnalysis?: { gaps?: Array<{ area: string; recommendation: string }>; missingKeywords?: string[] }
): Record<string, unknown> {
  const isString = typeof resumeData === "string";
  const data = isString ? null : (resumeData as Record<string, unknown>);
  const personalInfo = (data?.personalInfo as Record<string, string>) || {};
  const name = personalInfo.name || "the candidate";
  const gaps = matchAnalysis?.gaps?.slice(0, 2).map((g) => g.area) || ["System Design", "Metrics"];
  const keywords = matchAnalysis?.missingKeywords?.slice(0, 3) || ["TypeScript", "React", "CI/CD"];

  return {
    jobTitle,
    companyName,
    focusAreas: [
      `Demonstrate ownership in ${jobTitle} responsibilities`,
      `Address gaps around ${gaps.join(" and ")}`,
      `Weave in keywords: ${keywords.join(", ")}`,
    ],
    categories: [
      {
        type: "behavioral",
        label: "Behavioral (STAR)",
        questions: [
          {
            question: `Tell me about a time you delivered impact relevant to this ${jobTitle} role.`,
            tips: "Use STAR: Situation, Task, Action, Result. Quantify the outcome.",
            sampleAnswerOutline: `${name} led a cross-functional initiative, reduced delivery time by 20%, and aligned stakeholders on measurable KPIs.`,
          },
          {
            question: "Describe a challenging technical decision you made under ambiguity.",
            tips: "Show trade-off analysis, not perfection. Mention collaboration.",
            sampleAnswerOutline:
              "Chose architecture X over Y due to latency constraints; documented ADR; validated with A/B metrics.",
          },
        ],
      },
      {
        type: "technical",
        label: "Technical Depth",
        questions: [
          {
            question: `How would you approach a core responsibility listed in the ${companyName} JD?`,
            tips: "Map JD requirements to your stack experience; mention testing and observability.",
            sampleAnswerOutline:
              "Break problem into components → define interfaces → ship iteratively → monitor with dashboards.",
          },
          {
            question: "Walk through debugging a production incident you resolved.",
            tips: "Emphasize calm triage, root cause, prevention.",
            sampleAnswerOutline: "Detected via alerts → isolated regression → hotfix → postmortem → added guardrails.",
          },
        ],
      },
      {
        type: "company",
        label: "Company Fit",
        questions: [
          {
            question: `Why ${companyName} and why this role now?`,
            tips: "Connect company mission/products to your career narrative.",
            sampleAnswerOutline: `Excited by ${companyName}'s product direction; role matches my strength in shipping user-facing systems.`,
          },
        ],
      },
    ],
    preparationChecklist: [
      "Review JD and map each requirement to 1 resume bullet",
      "Prepare 3 STAR stories with metrics",
      "Research company products and recent initiatives",
      `Prepare thoughtful questions for ${companyName} interviewers`,
      "Practice 60-second intro pitch",
      "Prepare talking points for identified skill gaps",
      "Test video/audio setup if remote interview",
    ],
  };
}

function getSimulatedCompanyResearch(
  jobDescription: string,
  companyName: string,
  jobTitle: string
): Record<string, unknown> {
  const jdLower = jobDescription.toLowerCase();
  const isTech =
    jdLower.includes("engineer") ||
    jdLower.includes("developer") ||
    jdLower.includes("software");
  const products = isTech
    ? ["Core platform product", "Developer tooling", "Customer-facing web applications"]
    : ["Primary service offering", "Enterprise solutions", "Customer success programs"];

  return {
    companyName,
    overview: `${companyName} operates in a competitive market, hiring for ${jobTitle} to scale delivery, improve product quality, and drive measurable business outcomes. Candidates should emphasize alignment with team velocity and customer impact.`,
    mission: "Deliver reliable, user-centric solutions while fostering innovation and cross-functional collaboration.",
    products,
    culture: [
      "Ownership and accountability",
      "Data-informed decision making",
      "Collaborative engineering culture",
      jdLower.includes("remote") ? "Remote-friendly async communication" : "In-office collaboration",
      "Continuous learning mindset",
    ],
    recentNews: [
      "Expanded hiring in core product engineering",
      "Focus on performance, reliability, and AI-assisted workflows",
      "Emphasis on customer retention and product-led growth",
    ],
    interviewTips: [
      `Research ${companyName}'s primary product and who uses it`,
      "Prepare examples showing measurable impact, not just responsibilities",
      "Ask about team structure, on-call expectations, and success metrics for the role",
      "Be ready to discuss trade-offs in recent projects",
      "Show curiosity about roadmap and how this role contributes",
    ],
    talkingPoints: [
      `Excited about ${companyName}'s product direction and user base`,
      `My experience maps to the ${jobTitle} requirements around delivery and quality`,
      "Comfortable collaborating with product, design, and stakeholders",
      "Track record of improving reliability and developer experience",
      "Interested in growing with a team that values ownership",
    ],
  };
}

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("🛠️ Starting Express App in DEVELOPER mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("🚀 Starting Express App in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`📡 NextStepResume.ai Analyzer Node listening on port ${PORT}`);
  });
}

startServer();
