import type { Express } from "express";
import type { GoogleGenAI } from "@google/genai";
import { registerAiAuditRoutes } from "./audit.ts";
import { registerAiApplicationRoutes } from "./application.ts";
import { registerAiGeminiRoutes } from "./geminiChat.ts";

export function registerAiRoutes(app: Express, ai: GoogleGenAI | null): void {
  registerAiAuditRoutes(app, ai);
  registerAiApplicationRoutes(app, ai);
  registerAiGeminiRoutes(app, ai);
}
