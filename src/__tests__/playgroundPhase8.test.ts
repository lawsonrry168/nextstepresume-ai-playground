import { describe, expect, it, beforeEach } from "vitest";
import { CANVAS_SHORTCUTS } from "../lib/canvasStudioTypes";
import { buildFreeLayoutSections } from "../lib/resumeFreeLayout";
import { getResumeTemplateTheme, getTemplateThemeLabel } from "../lib/resumeTemplateCatalog";
import { getSectionLabel } from "../lib/sectionLabels";
import { initialResumeData } from "../data";
import { ensureLocaleLoaded, setActiveLocale } from "../i18n/translate";
import type { MessageTree } from "../i18n/types";
import zhTW from "../i18n/locales/zh-TW";
import templateThemesEn from "../i18n/locales/data/templateThemes.en";
import templateThemesZhTW from "../i18n/locales/data/templateThemes.zh-TW";

const zhMessages = zhTW as MessageTree;

describe("template theme labels", () => {
  beforeEach(async () => {
    setActiveLocale("zh-TW");
    await ensureLocaleLoaded("zh-TW");
    setActiveLocale("en");
    await ensureLocaleLoaded("en");
  });

  it("returns locale labels for zh-TW and en", () => {
    const theme = getResumeTemplateTheme("modern-01");
    expect(getTemplateThemeLabel(theme, "zh-TW")).toBe(templateThemesZhTW["modern-01"]);
    expect(getTemplateThemeLabel(theme, "en")).toBe(templateThemesEn["modern-01"]);
  });
});

describe("free layout section metadata", () => {
  beforeEach(async () => {
    setActiveLocale("zh-TW");
    await ensureLocaleLoaded("zh-TW");
  });

  it("builds id-only sections resolved via sectionLabels i18n", () => {
    const sections = buildFreeLayoutSections(initialResumeData);
    expect(sections.every((section) => "labelZh" in section === false)).toBe(true);
    const header = sections.find((section) => section.id === "header");
    expect(header).toBeDefined();
    expect(getSectionLabel(header!.id)).toBe(String((zhMessages.sections as MessageTree).header));
  });
});

describe("canvas shortcuts catalog", () => {
  beforeEach(async () => {
    setActiveLocale("zh-TW");
    await ensureLocaleLoaded("zh-TW");
  });

  it("stores shortcut ids without embedded labelZh strings", () => {
    expect(CANVAS_SHORTCUTS.length).toBeGreaterThan(20);
    for (const shortcut of CANVAS_SHORTCUTS) {
      expect(shortcut.id).toBeTruthy();
      expect(shortcut.keys.length).toBeGreaterThan(0);
      expect("labelZh" in shortcut).toBe(false);
    }
  });
});

describe("jobsdb listing i18n", () => {
  const sampleJob = {
    id: "1",
    url: "https://hk.jobsdb.com/job/1",
    title: "Frontend Engineer",
    company: "Acme HK",
    location: "Central",
    description_text: "Build React apps.",
    bulletPoints: ["React"],
  };

  beforeEach(async () => {
    setActiveLocale("zh-TW");
    await ensureLocaleLoaded("zh-TW");
    setActiveLocale("en");
    await ensureLocaleLoaded("en");
  });

  it("formats JD headers in English when locale is en", async () => {
    const { jobsdbListingToJobDescription } = await import("../lib/jobsdbApifyScraper");
    const jobsdbJd = zhMessages.jobsdbJd as MessageTree;
    const text = jobsdbListingToJobDescription(sampleJob, "en");
    expect(text).toContain("Build React apps.");
    expect(text).toContain(`Role：${sampleJob.title}`);
    expect(text).not.toContain(String(jobsdbJd.role));
  });

  it("formats JD headers in Chinese when locale is zh-TW", async () => {
    const { jobsdbListingToJobDescription } = await import("../lib/jobsdbApifyScraper");
    const jobsdbJd = zhMessages.jobsdbJd as MessageTree;
    const text = jobsdbListingToJobDescription(sampleJob, "zh-TW");
    expect(text).toContain(`${String(jobsdbJd.role)}：${sampleJob.title}`);
    expect(text).toContain("Build React apps.");
  });
});
