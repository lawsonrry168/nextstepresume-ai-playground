import type { JobsdbListing } from "../../src/lib/jobsdbApifyScraper.ts";

export function shouldSimulateJobsdbSearch(): boolean {
  const flag = process.env.NSR_JOBSDB_SIMULATE?.trim().toLowerCase();
  if (flag === "1" || flag === "true" || flag === "yes") {
    return true;
  }
  if (flag === "0" || flag === "false" || flag === "no") {
    return false;
  }
  return !process.env.APIFY_API_TOKEN?.trim();
}

export function buildSimulatedJobsdbListings(keyword?: string, limit = 10): JobsdbListing[] {
  const query = keyword?.trim() || "software engineer";
  const count = Math.min(Math.max(1, limit), 3);
  return Array.from({ length: count }, (_, index) => ({
    id: `sim-${index + 1}`,
    url: `https://hk.jobsdb.com/job/sim-${index + 1}`,
    title: `${query} (Sim ${index + 1})`,
    company: "NextStep Demo Co.",
    location: "Hong Kong",
    workType: "Full-time",
    salary: "HK$ 35,000 – 45,000",
    postedAt_relative: "2d ago",
    description_text: `Simulated JobsDB listing for E2E and playground demos.\nKeyword: ${query}.`,
    bulletPoints: ["React", "TypeScript", "Playwright"],
    source: "simulation",
  }));
}
