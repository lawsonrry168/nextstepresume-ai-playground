import type { Express } from "express";
import { ThinkingLevel, type GoogleGenAI } from "@google/genai";
import { getAiWritingGuide } from "../../src/lib/market/aiWritingGuide.ts";
import { parseAiJson, withMarketWritingGuide } from "../lib/aiContext.ts";
import {
  getSimulatedAnalysis,
  getSimulatedCompanyResearch,
  getSimulatedCoverLetter,
  getSimulatedGeminiReply,
  getSimulatedGrammarTone,
  getSimulatedInterviewPrep,
  getSimulatedMatchAnalysis,
  getSimulatedReadability,
  getSimulatedSkillConsistency,
} from "../simulation/engine.ts";

export function registerAiRoutes(app: Express, ai: GoogleGenAI | null): void {
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
}
