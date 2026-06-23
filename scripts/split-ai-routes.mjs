import fs from "fs";
import path from "path";

const src = fs.readFileSync("server/routes/ai.ts", "utf8");
const lines = src.split("\n");

const header = `import type { Express } from "express";
import { ThinkingLevel, type GoogleGenAI } from "@google/genai";
import { getAiWritingGuide } from "../../src/lib/market/aiWritingGuide.ts";
import { parseAiJson, withMarketWritingGuide } from "../lib/aiContext.ts";
`;

const simImports = {
  audit: `import {
  getSimulatedAnalysis,
  getSimulatedGrammarTone,
  getSimulatedMatchAnalysis,
  getSimulatedReadability,
  getSimulatedSkillConsistency,
} from "../simulation/engine.ts";`,
  application: `import {
  getSimulatedCompanyResearch,
  getSimulatedCoverLetter,
  getSimulatedInterviewPrep,
} from "../simulation/engine.ts";`,
  gemini: `import { getSimulatedGeminiReply } from "../simulation/engine.ts";`,
};

const ranges = {
  audit: [17, 377],
  application: [378, 658],
  gemini: [659, 727],
};

const names = {
  audit: "registerAiAuditRoutes",
  application: "registerAiApplicationRoutes",
  gemini: "registerAiGeminiRoutes",
};

for (const [key, [start, end]] of Object.entries(ranges)) {
  const body = lines.slice(start, end).join("\n");
  const out = `${header}
${simImports[key]}

export function ${names[key]}(app: Express, ai: GoogleGenAI | null): void {
${body}
}
`;
  const outPath = path.join("server/routes/ai", `${key === "gemini" ? "geminiChat" : key}.ts`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out);
  console.log("wrote", outPath);
}

const index = `import type { Express } from "express";
import type { GoogleGenAI } from "@google/genai";
import { registerAiAuditRoutes } from "./audit.ts";
import { registerAiApplicationRoutes } from "./application.ts";
import { registerAiGeminiRoutes } from "./geminiChat.ts";

export function registerAiRoutes(app: Express, ai: GoogleGenAI | null): void {
  registerAiAuditRoutes(app, ai);
  registerAiApplicationRoutes(app, ai);
  registerAiGeminiRoutes(app, ai);
}
`;
fs.writeFileSync("server/routes/ai/index.ts", index);
console.log("wrote server/routes/ai/index.ts");
