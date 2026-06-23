import type { Request } from "express";
import { getAiWritingGuide } from "../../src/lib/market/aiWritingGuide.ts";

export function withMarketWritingGuide(req: Request, prompt: string): string {
  return `${prompt.trim()}\n\n${getAiWritingGuide({ locale: req.header("X-Locale") ?? undefined })}`;
}

export function contentHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function deterministicRange(seed: string, min: number, max: number): number {
  const range = max - min + 1;
  return min + (contentHash(seed) % range);
}

export function deterministicPresent(seed: string): boolean {
  return contentHash(seed) % 2 === 0;
}

export function parseAiJson<T extends object>(text: string, fallback: () => T): T {
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

export function resumePayloadText(resumeData: unknown): string {
  return typeof resumeData === "string" ? resumeData : JSON.stringify(resumeData, null, 2);
}
