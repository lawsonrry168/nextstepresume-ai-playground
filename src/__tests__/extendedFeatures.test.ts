import { describe, it, expect, beforeEach, vi } from "vitest";
import { calculateLiveAtsScore, extractJdKeywords } from "../lib/atsKeywords";
import { parseResumeText } from "../lib/resumeTextParser";
import { estimateSalary } from "../lib/salaryBenchmark";
import { validatePdfBuffer } from "../lib/pdfExtract";
import { initialResumeData, initialJobDescription } from "../data";
import { extractJobMeta } from "../lib/extractJobMeta";
import { applyTailorAnalysis } from "../lib/applyTailorAnalysis";
import {
  createApplicationPackage,
  listApplicationPackages,
  deleteApplicationPackage,
} from "../lib/applicationPackageStorage";

describe("atsKeywords", () => {
  it("extracts react/typescript from sample JD", () => {
    const keywords = extractJdKeywords(initialJobDescription);
    expect(keywords.some((k) => k.includes("react"))).toBe(true);
    expect(keywords.some((k) => k.includes("typescript"))).toBe(true);
  });

  it("calculates live ATS score consistently", () => {
    const a = calculateLiveAtsScore(initialResumeData, initialJobDescription);
    const b = calculateLiveAtsScore(initialResumeData, initialJobDescription);
    expect(a.score).toBe(b.score);
    expect(a.score).toBeGreaterThan(0);
  });
});

describe("resumeTextParser", () => {
  it("parses structured resume text", () => {
    const text = `
Alex Mercer
Frontend Developer
alex.mercer@gmail.com

SUMMARY
Frontend developer with React experience.

EXPERIENCE
Junior React Engineer - ByteForce
2024-03 - Present
- Built React components for dashboards.

SKILLS
React, TypeScript, Tailwind CSS
`;
    const parsed = parseResumeText(text);
    expect(parsed.personalInfo.name).toContain("Alex");
    expect(parsed.skills.length).toBeGreaterThan(0);
    expect(parsed.experience.length).toBeGreaterThan(0);
  });
});

describe("salaryBenchmark", () => {
  it("returns higher mid salary with more experience", () => {
    const junior = estimateSalary("Frontend Engineer", 2);
    const senior = estimateSalary("Frontend Engineer", 8);
    expect(senior.mid).toBeGreaterThan(junior.mid);
    expect(junior.currency).toBe("HKD");
  });
});

describe("pdfExtract", () => {
  it("rejects invalid pdf buffer", () => {
    expect(() => validatePdfBuffer(Buffer.from("not a pdf"))).toThrow("Invalid PDF");
  });
});

describe("extractJobMeta", () => {
  it("extracts company and title hints from JD", () => {
    const jd = `Senior Frontend Engineer at Acme Corp
We are hiring a Senior Frontend Engineer to build React apps.`;
    const meta = extractJobMeta(jd);
    expect(meta.companyName.toLowerCase()).toContain("acme");
    expect(meta.jobTitle.toLowerCase()).toContain("frontend");
  });
});

describe("applyTailorAnalysis", () => {
  it("updates summary and matched experience bullets", () => {
    const expId = initialResumeData.experience[0]?.id;
    if (!expId) return;
    const analysis = {
      atsScore: 80,
      categories: [],
      keywords: [],
      weakPhrases: [],
      tailoredSummary: "Tailored professional summary.",
      tailoredBulletPoints: [
        {
          experienceId: expId,
          originalBullets: initialResumeData.experience[0].bullets,
          optimizedBullets: ["Optimized bullet with metrics."],
        },
      ],
    };
    const next = applyTailorAnalysis(initialResumeData, analysis);
    expect(next.summary).toBe("Tailored professional summary.");
    expect(next.experience[0].bullets[0]).toContain("Optimized");
  });
});

describe("applicationPackageStorage", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
    });
  });

  it("creates and lists application packages", () => {
    const pkg = createApplicationPackage({
      status: "ready",
      companyName: "Acme",
      jobTitle: "Engineer",
      jobDescription: "Build things",
      resumeSnapshot: initialResumeData,
      templateStyle: "modern-01",
      tailorAnalysis: null,
      matchAnalysis: null,
      coverLetter: null,
    });
    const list = listApplicationPackages();
    expect(list.some((p) => p.id === pkg.id)).toBe(true);
    deleteApplicationPackage(pkg.id);
    expect(listApplicationPackages().some((p) => p.id === pkg.id)).toBe(false);
  });
});

describe("applicationTimeline", () => {
  it("appends timeline events", async () => {
    const { ensurePackageTimeline, appendTimelineEvent, createApplicationEvent } = await import(
      "../lib/applicationTimeline"
    );
    const base = ensurePackageTimeline({
      id: "1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "ready",
      companyName: "Acme",
      jobTitle: "Engineer",
      jobDescription: "JD",
      resumeSnapshot: initialResumeData,
      templateStyle: "modern-01",
      tailorAnalysis: null,
      matchAnalysis: null,
      coverLetter: null,
    });
    const withNote = appendTimelineEvent(
      base,
      createApplicationEvent("note", "Added note", "Follow up HR")
    );
    expect(withNote.timeline?.length).toBeGreaterThanOrEqual(2);
  });
});

describe("applicationPackageExport", () => {
  it("builds match report markdown", async () => {
    const { buildMatchReportMarkdown } = await import("../lib/applicationPackageExport");
    const md = buildMatchReportMarkdown({
      id: "x",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "ready",
      companyName: "Acme",
      jobTitle: "Engineer",
      jobDescription: "Build apps",
      resumeSnapshot: initialResumeData,
      templateStyle: "modern-01",
      tailorAnalysis: null,
      matchAnalysis: {
        overallScore: 82,
        jobTitle: "Engineer",
        summary: "Good fit",
        matchedStrengths: ["React"],
        gaps: [],
        missingKeywords: ["Docker"],
        actionPlan: ["Add Docker"],
      },
      coverLetter: null,
    });
    expect(md).toContain("82%");
    expect(md).toContain("Docker");
  });
});

describe("followUpReminderEngine", () => {
  const basePkg = {
    id: "a1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "applied" as const,
    companyName: "Acme",
    jobTitle: "Engineer",
    jobDescription: "JD",
    resumeSnapshot: initialResumeData,
    templateStyle: "modern-01" as const,
    tailorAnalysis: null,
    matchAnalysis: null,
    coverLetter: null,
  };

  it("collects due follow-up reminders with kind-specific notifyKey", async () => {
    const { collectFollowUpReminders } = await import("../lib/followUpReminderEngine");
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const reminders = collectFollowUpReminders(
      [{ ...basePkg, followUpDate: today.toISOString() }],
      today
    );
    const due = reminders.find((r) => r.kind === "follow_up_due");
    expect(due).toBeDefined();
    expect(due!.notifyKey).toContain("follow_up_due");
    expect(due!.notifyKey).not.toContain("follow_up_overdue");
  });

  it("uses distinct notifyKey for overdue follow-ups", async () => {
    const { collectFollowUpReminders } = await import("../lib/followUpReminderEngine");
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dueReminders = collectFollowUpReminders(
      [{ ...basePkg, followUpDate: today.toISOString() }],
      today
    );
    const overdueReminders = collectFollowUpReminders(
      [{ ...basePkg, followUpDate: yesterday.toISOString() }],
      today
    );

    const dueKey = dueReminders.find((r) => r.kind === "follow_up_due")?.notifyKey;
    const overdueKey = overdueReminders.find((r) => r.kind === "follow_up_overdue")?.notifyKey;
    expect(dueKey).toBeDefined();
    expect(overdueKey).toBeDefined();
    expect(dueKey).not.toBe(overdueKey);
    expect(overdueKey).toContain("follow_up_overdue");
  });

  it("syncs prefs when browser permission is denied", async () => {
    const { syncNotificationPrefsWithBrowser } = await import("../lib/followUpReminderEngine");
    vi.stubGlobal("Notification", { permission: "denied" });
    const synced = syncNotificationPrefsWithBrowser({ enabled: true, permissionGranted: true });
    expect(synced.enabled).toBe(false);
    expect(synced.permissionGranted).toBe(false);
  });
});

describe("applicationPackageStorage field updates", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
    });
  });

  it("clears followUpDate when set to null", async () => {
    const { createApplicationPackage, updateApplicationPackageFields, getApplicationPackage } =
      await import("../lib/applicationPackageStorage");
    const pkg = createApplicationPackage({
      status: "applied",
      companyName: "Acme",
      jobTitle: "Engineer",
      jobDescription: "JD",
      resumeSnapshot: initialResumeData,
      templateStyle: "modern-01",
      tailorAnalysis: null,
      matchAnalysis: null,
      coverLetter: null,
      followUpDate: new Date().toISOString(),
    });
    expect(pkg.followUpDate).toBeDefined();

    const updated = updateApplicationPackageFields(pkg.id, { followUpDate: null });
    expect(updated?.followUpDate).toBeUndefined();

    const stored = getApplicationPackage(pkg.id);
    expect(stored?.followUpDate).toBeUndefined();
    const raw = localStorage.getItem("nsr_application_packages");
    expect(raw).not.toContain("followUpDate");
  });
});

describe("html2canvasColorFix", () => {
  it("detects unsupported modern color functions", async () => {
    const { containsUnsupportedColor, isHtml2CanvasSafeCssValue } = await import(
      "../lib/html2canvasColorFix"
    );
    expect(containsUnsupportedColor("oklch(0.5 0.1 240)")).toBe(true);
    expect(containsUnsupportedColor("color-mix(in srgb, red, blue)")).toBe(true);
    expect(containsUnsupportedColor("color(srgb 1 0 0)")).toBe(true);
    expect(containsUnsupportedColor("rgb(255, 0, 0)")).toBe(false);
    expect(containsUnsupportedColor("#ff0000")).toBe(false);
    expect(isHtml2CanvasSafeCssValue("rgb(255, 0, 0)")).toBe(true);
    expect(isHtml2CanvasSafeCssValue("color(srgb 1 0 0)")).toBe(false);
  });

  it("sanitizes stylesheet css while preserving layout rules", async () => {
    const { sanitizeStylesheetCss } = await import("../lib/html2canvasColorFix");
    const css = `
      .resume-template-marginalia { display: flex; gap: 28px; background: oklch(0.98 0.01 90); }
      .chip { background: color-mix(in srgb, #d4edda 82%, transparent); }
    `;
    const sanitized = sanitizeStylesheetCss(css);
    expect(sanitized).toContain("display: flex");
    expect(sanitized).toContain("gap: 28px");
    expect(sanitized).not.toMatch(/oklch|color-mix|\bcolor\(/i);
  });

  it("converts oklch to rgb via canvas probe", async () => {
    const { toCanvasSafeRgb, isHtml2CanvasSafeCssValue } = await import(
      "../lib/html2canvasColorFix"
    );
    const rgb = toCanvasSafeRgb("oklch(0.55 0.02 264)");
    expect(isHtml2CanvasSafeCssValue(rgb)).toBe(true);
    expect(rgb).toMatch(/^rgba?\(/);
  });

  it("exports letter-spacing reset for html2canvas capture", async () => {
    const { resetLetterSpacingForHtml2Canvas } = await import("../lib/html2canvasColorFix");
    expect(typeof resetLetterSpacingForHtml2Canvas).toBe("function");
  });
});

describe("pdfHtmlRenderer", () => {
  it("converts markdown headings and lists to html", async () => {
    const { markdownToHtml } = await import("../lib/pdfHtmlRenderer");
    const html = markdownToHtml("# Title\n\n## Section\n\n- item one\n- item two");
    expect(html).toContain("<h1");
    expect(html).toContain("Title");
    expect(html).toContain("<h2");
    expect(html).toContain("<li");
    expect(html).toContain("item one");
  });

  it("escapes html in markdown lines", async () => {
    const { markdownToHtml } = await import("../lib/pdfHtmlRenderer");
    const html = markdownToHtml("<script>alert(1)</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("keeps single-page visual exports inside an A4 safe inset", async () => {
    const { computeSinglePageCanvasPlacement } = await import("../lib/pdfHtmlRenderer");
    const placement = computeSinglePageCanvasPlacement(595, 842, 794, 1123, {
      preferFillWidth: true,
    });
    expect(placement.offsetX).toBeCloseTo(14, 5);
    expect(placement.offsetY).toBeGreaterThan(14);
    expect(placement.renderWidth).toBeLessThan(595);
    expect(placement.renderHeight).toBeLessThan(842);
  });
});

describe("jdHtmlExtract", () => {
  it("strips html and preserves line breaks", async () => {
    const { stripHtmlToText, buildJobDescriptionFromHtml } = await import("../lib/jdHtmlExtract");
    const html = `<html><head><title>Senior Engineer | Acme Corp</title></head><body><h1>Frontend Dev</h1><p>Build React apps with TypeScript.</p></body></html>`;
    const text = stripHtmlToText(html);
    expect(text).toContain("Frontend Dev");
    expect(text).toContain("React apps");
    const built = buildJobDescriptionFromHtml(html);
    expect(built.jobDescription.length).toBeGreaterThan(20);
    expect(built.headline).toContain("Senior Engineer");
  });
});

describe("createDraftApplicationPackage", () => {
  it("builds draft package with source url in notes", async () => {
    const { ensureLocaleLoaded, setActiveLocale } = await import("../i18n/translate");
    const zhTW = (await import("../i18n/locales/zh-TW")).default;
    const zhMessages = zhTW as import("../i18n/types").MessageTree;
    setActiveLocale("zh-TW");
    await ensureLocaleLoaded("zh-TW");

    const { buildDraftApplicationPackage } = await import("../lib/createDraftApplicationPackage");
    const draft = buildDraftApplicationPackage({
      companyName: "Acme",
      jobTitle: "Engineer",
      jobDescription: "We need React developers for our team with strong TypeScript skills.",
      resumeSnapshot: initialResumeData,
      templateStyle: "modern-01",
      sourceUrl: "https://example.com/jobs/1",
    });
    expect(draft.status).toBe("draft");
    expect(draft.notes).toContain("https://example.com/jobs/1");
    expect(draft.timeline?.[0]?.title).toBe(
      String((zhMessages.applicationDraft as import("../i18n/types").MessageTree).createdFromImport),
    );
  });
});

describe("importJdFromPaste", () => {
  it("parses pasted jd text", async () => {
    const { importJdFromPaste } = await import("../lib/jdUrlFetch");
    const result = importJdFromPaste(
      "職務名稱：資深前端工程師\n公司名稱：測試科技\n\n我們需要 React 與 TypeScript 經驗。"
    );
    expect(result.jobDescription.length).toBeGreaterThan(20);
  });
});

describe("jobsdbApifyScraper", () => {
  it("maps listing to imported job description", async () => {
    const { ensureLocaleLoaded, setActiveLocale } = await import("../i18n/translate");
    setActiveLocale("zh-TW");
    await ensureLocaleLoaded("zh-TW");

    const { jobsdbListingToImportedJob, normalizeJobsdbListings } = await import(
      "../lib/jobsdbApifyScraper"
    );
    const jobs = normalizeJobsdbListings([
      {
        id: "1",
        url: "https://hk.jobsdb.com/job/1",
        title: "Frontend Engineer",
        company: "Acme HK",
        location: "Central",
        description_text: "Build React apps.",
        bulletPoints: ["React", "TypeScript"],
      },
    ]);
    expect(jobs).toHaveLength(1);
    const imported = jobsdbListingToImportedJob(jobs[0], "zh-TW");
    expect(imported.jobTitle).toBe("Frontend Engineer");
    expect(imported.companyName).toBe("Acme HK");
    expect(imported.jobDescription).toContain("Build React apps.");
    expect(imported.jobDescription).toContain("職位");
    expect(imported.sourceUrl).toContain("jobsdb.com");
  });
});

describe("ApplicationNotesEditor date helpers", () => {
  it("round-trips local date without day shift", async () => {
    const { localDateInputToIso, isoToLocalDateInput } = await import(
      "../components/playground/ApplicationNotesEditor"
    );
    const iso = localDateInputToIso("2026-06-18");
    expect(iso).toBeTruthy();
    expect(isoToLocalDateInput(iso!)).toBe("2026-06-18");
  });
});

describe("ooxmlApplicationExport", () => {
  it("builds ooxml blob for resume", async () => {
    const { buildResumeOoxmlBlob } = await import("../lib/ooxmlApplicationExport");
    const blob = await buildResumeOoxmlBlob(initialResumeData);
    expect(blob.size).toBeGreaterThan(1000);
    expect(blob.type).toContain("wordprocessingml");
  });
});

describe("storageKeys", () => {
  it("purges legacy FirstResume localStorage keys on boot", async () => {
    const { LEGACY_STORAGE_KEYS, NSR_STORAGE_KEYS, purgeLegacyStorage } = await import(
      "../lib/storageKeys"
    );
    const store = new Map<string, string>();
    for (const key of LEGACY_STORAGE_KEYS) {
      store.set(key, "legacy");
    }
    store.set(NSR_STORAGE_KEYS.workspaceResume, '{"ok":true}');
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });

    purgeLegacyStorage();

    for (const key of LEGACY_STORAGE_KEYS) {
      expect(store.has(key)).toBe(false);
    }
    expect(store.get(NSR_STORAGE_KEYS.workspaceResume)).toBe('{"ok":true}');
  });
});
