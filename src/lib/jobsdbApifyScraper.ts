/** Apify actor: shahidirfan/jobsdb-scraper — https://apify.com/shahidirfan/jobsdb-scraper */

import { getActiveLocale, t } from "../i18n/translate";
import type { AppLocale } from "../i18n/types";

export type JobsdbCountry = "hk" | "th";
export type JobsdbPostedDate = "anytime" | "24h" | "7d" | "30d";

export type JobsdbSearchInput = {
  keyword?: string;
  location?: string;
  startUrl?: string;
  country?: JobsdbCountry;
  posted_date?: JobsdbPostedDate;
  results_wanted?: number;
};

export type JobsdbListing = {
  id: string;
  url: string;
  title: string;
  company: string;
  location: string;
  workType?: string;
  classification?: string;
  salary?: string;
  postedAt_relative?: string;
  postedAt_iso?: string;
  description_text?: string;
  teaser?: string;
  bulletPoints?: string[];
  source?: string;
};

export type JobsdbSearchResponse = {
  jobs: JobsdbListing[];
  meta: {
    source: "jobsdb-apify";
    count: number;
    simulated: false;
  };
};

function jdLabel(key: string, locale?: AppLocale): string {
  return t(`jobsdbJd.${key}`, undefined, locale ?? getActiveLocale());
}

export function jobsdbListingToJobDescription(job: JobsdbListing, locale?: AppLocale): string {
  const loc = locale ?? getActiveLocale();
  const lines: string[] = [];

  if (job.title) lines.push(`${jdLabel("role", loc)}：${job.title}`);
  if (job.company) lines.push(`${jdLabel("company", loc)}：${job.company}`);
  if (job.location) lines.push(`${jdLabel("location", loc)}：${job.location}`);
  if (job.workType) lines.push(`${jdLabel("workType", loc)}：${job.workType}`);
  if (job.classification) lines.push(`${jdLabel("classification", loc)}：${job.classification}`);
  if (job.salary) lines.push(`${jdLabel("salary", loc)}：${job.salary}`);
  if (job.postedAt_relative) lines.push(`${jdLabel("posted", loc)}：${job.postedAt_relative}`);

  lines.push("");

  const body = job.description_text?.trim() || job.teaser?.trim();
  if (body) {
    lines.push(body);
  }

  if (job.bulletPoints?.length) {
    lines.push("");
    lines.push(`${jdLabel("highlights", loc)}：`);
    for (const point of job.bulletPoints) {
      if (point.trim()) lines.push(`• ${point.trim()}`);
    }
  }

  if (job.url) {
    lines.push("");
    lines.push(t("jobsdbJd.source", { url: job.url }, loc));
  }

  return lines.join("\n").trim();
}

export function jobsdbListingToImportedJob(
  job: JobsdbListing,
  locale?: AppLocale,
): {
  jobDescription: string;
  jobTitle: string;
  companyName: string;
  sourceUrl: string;
} {
  return {
    jobDescription: jobsdbListingToJobDescription(job, locale),
    jobTitle: job.title?.trim() || "",
    companyName: job.company?.trim() || "",
    sourceUrl: job.url?.trim() || "",
  };
}

export function normalizeJobsdbListings(raw: unknown): JobsdbListing[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === "object")
    .map((item) => ({
      id: String(item.id ?? ""),
      url: String(item.url ?? ""),
      title: String(item.title ?? ""),
      company: String(item.company ?? ""),
      location: String(item.location ?? ""),
      workType: item.workType ? String(item.workType) : undefined,
      classification: item.classification ? String(item.classification) : undefined,
      salary: item.salary ? String(item.salary) : undefined,
      postedAt_relative: item.postedAt_relative ? String(item.postedAt_relative) : undefined,
      postedAt_iso: item.postedAt_iso ? String(item.postedAt_iso) : undefined,
      description_text: item.description_text ? String(item.description_text) : undefined,
      teaser: item.teaser ? String(item.teaser) : undefined,
      bulletPoints: Array.isArray(item.bulletPoints)
        ? item.bulletPoints.map((p) => String(p))
        : undefined,
      source: item.source ? String(item.source) : undefined,
    }))
    .filter((job) => job.title.trim() || job.url.trim());
}
