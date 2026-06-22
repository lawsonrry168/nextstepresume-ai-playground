import fs from "fs";

const lines = fs.readFileSync("server.ts", "utf8").split(/\r?\n/);

const imports = `import type { Express, Request } from "express";
import { ThinkingLevel, type GoogleGenAI } from "@google/genai";
import { getAiWritingGuide } from "../../src/lib/market/aiWritingGuide.ts";
import { parseAiJson, resumePayloadText, withMarketWritingGuide } from "../lib/aiContext.ts";
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
`;

// Routes: lines 162-247 analyze through 924 ask-gemini end (1-indexed) -> 161-923
const routeBody = lines
  .slice(161, 924)
  .join("\n")
  .replace(/^app\.post/gm, "  app.post");

const footer = "\n}\n";

fs.mkdirSync("server/routes", { recursive: true });
fs.writeFileSync("server/routes/ai.ts", imports + routeBody + footer);
console.log("Wrote server/routes/ai.ts");
