import type { Express } from "express";
import { ThinkingLevel, type GoogleGenAI } from "@google/genai";
import { getAiWritingGuide } from "../../../src/lib/market/aiWritingGuide.ts";
import { getSimulatedGeminiReply } from "../../simulation/engine.ts";

export function registerAiGeminiRoutes(app: Express, ai: GoogleGenAI | null): void {
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
