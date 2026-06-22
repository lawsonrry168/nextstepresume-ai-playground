import type { JobsdbSearchInput, JobsdbSearchResponse } from "./jobsdbApifyScraper";
import { t } from "../i18n/translate";

type MeasuredFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function searchJobsdb(
  input: JobsdbSearchInput,
  measuredFetch: MeasuredFetch
): Promise<JobsdbSearchResponse> {
  const res = await measuredFetch("/api/jobsdb/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await res.json()) as JobsdbSearchResponse & { error?: string };

  if (!res.ok) {
    throw new Error(data.error || t("apiErrors.jobsdbSearchFailed", { status: res.status }));
  }

  return data;
}
