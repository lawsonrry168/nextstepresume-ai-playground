import { parseApiJson } from "./apiResponse";
import { extractJobMeta } from "./extractJobMeta";
import { t } from "../i18n/translate";

export interface JdFetchResult {
  jobDescription: string;
  jobTitle: string;
  companyName: string;
  sourceUrl: string;
  pageTitle?: string;
  extractedChars?: number;
}

type MeasuredFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function fetchJdFromUrl(
  url: string,
  measuredFetch: MeasuredFetch
): Promise<JdFetchResult> {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error(t("toast.playground.jdUrlRequired"));
  }

  const res = await measuredFetch("/api/jd/fetch-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: trimmed }),
  });

  const { data } = await parseApiJson<JdFetchResult>(res);
  if (!data.jobDescription || data.jobDescription.trim().length < 20) {
    throw new Error(t("apiErrors.jdExtractInsufficient"));
  }
  return data;
}

export interface JdPasteImportResult {
  jobDescription: string;
  jobTitle: string;
  companyName: string;
}

/** Client-side paste import — parses meta from pasted text only. */
export function importJdFromPaste(text: string): JdPasteImportResult {
  const jobDescription = text.trim();
  if (jobDescription.length < 20) {
    throw new Error(t("apiErrors.jdPasteMinLength"));
  }
  const meta = extractJobMeta(jobDescription);
  return {
    jobDescription,
    jobTitle: meta.jobTitle,
    companyName: meta.companyName,
  };
}
