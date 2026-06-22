import type { Express } from "express";
import type { GoogleGenAI } from "@google/genai";
import { describe, expect, it } from "vitest";
import { registerAiRoutes } from "../../server/routes/ai.ts";

describe("registerAiRoutes", () => {
  it("registers all quota-protected AI endpoints", () => {
    const paths: string[] = [];
    const app = {
      post: (path: string) => {
        paths.push(path);
      },
    } as unknown as Express;

    registerAiRoutes(app, null);

    expect(paths).toEqual(
      expect.arrayContaining([
        "/api/analyze",
        "/api/grammar-tone-check",
        "/api/readability-complexity",
        "/api/skill-job-consistency",
        "/api/match-analysis",
        "/api/cover-letter",
        "/api/interview-prep",
        "/api/company-research",
        "/api/ask-gemini",
      ]),
    );
  });

  it("invokes simulation fallback when Gemini client is unavailable", async () => {
    let handler: ((req: unknown, res: { json: (body: unknown) => void }) => Promise<void>) | undefined;
    const app = {
      post: (path: string, fn: typeof handler) => {
        if (path === "/api/analyze") handler = fn;
      },
    } as unknown as Express;

    registerAiRoutes(app, null as GoogleGenAI | null);

    const body = await new Promise<Record<string, unknown>>((resolve) => {
      void handler?.(
        { body: { resumeData: { personalInfo: { name: "Alex Chan", title: "Engineer" } } }, header: () => undefined },
        {
          json: (payload: unknown) => resolve(payload as Record<string, unknown>),
        },
      );
    });

    expect(body.meta).toEqual({ source: "simulation", simulated: true });
    expect(typeof body.atsScore).toBe("number");
  });
});
