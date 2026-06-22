import type { AiCreditAction } from "./types";

/** AI credit cost per action (shared client + server). */
export type { AiCreditAction };
export const AI_CREDIT_COSTS: Record<AiCreditAction, number> = {
  tailor: 1,
  match: 1,
  auditBundle: 1,
  coverLetter: 2,
  interviewPrep: 3,
  companyResearch: 3,
  geminiFlash: 1,
  geminiThinking: 2,
  wizard: 5,
};

export const API_ROUTE_CREDIT_ACTION: Record<string, AiCreditAction> = {
  "/api/analyze": "tailor",
  "/api/match-analysis": "match",
  "/api/grammar-tone-check": "auditBundle",
  "/api/readability-complexity": "auditBundle",
  "/api/skill-job-consistency": "auditBundle",
  "/api/cover-letter": "coverLetter",
  "/api/interview-prep": "interviewPrep",
  "/api/company-research": "companyResearch",
  "/api/ask-gemini": "geminiFlash",
};
