// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { initialResumeData } from "../data";
import { buildApplicationSummaryMarkdown } from "../lib/applicationPackageExport";
import { isE2eDocxStubEnabled, isE2eExportTrackingEnabled } from "../lib/e2eExportTrack";
import { buildResumeOoxmlFallbackBlob } from "../lib/ooxmlApplicationExport";
import { formatAtsBullet, formatAtsDateRange, formatAtsInlineList } from "../lib/resumeAtsPdfExport";
import { buildResumeDocxHtml, downloadDocxFromHtml } from "../lib/resumeDocxExport";

describe("phase 18 docx export helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("builds word-compatible html with resume name", () => {
    const html = buildResumeDocxHtml(initialResumeData);
    expect(html).toContain(initialResumeData.personalInfo.name);
    expect(html).toContain("xmlns:w='urn:schemas-microsoft-com:office:word'");
  });

  it("uses ASCII-safe separators for export text", () => {
    expect(formatAtsDateRange("2024-01", "Present")).toBe("2024-01 - Present");
    expect(formatAtsInlineList(["hong@example.com", "", "Hong Kong"])).toBe("hong@example.com | Hong Kong");
    expect(formatAtsBullet("Built export flow")).toBe("- Built export flow");
  });

  it("builds compatibility Word HTML without typographic bullets or range dashes", () => {
    const sample = {
      ...initialResumeData,
      experience: [
        {
          ...initialResumeData.experience[0]!,
          startDate: "2024-01",
          endDate: "Present",
          location: "Remote",
          bullets: ["Built export flow"],
        },
      ],
    };
    const html = buildResumeDocxHtml(sample);
    expect(html).toContain("2024-01 - Present");
    expect(html).toContain("- Built export flow");
    expect(html).not.toContain("\u2022");
    expect(html).not.toContain("\u2013");
  });

  it("preserves the requested legacy Word extension", () => {
    const createdLinks: HTMLAnchorElement[] = [];
    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.spyOn(document, "createElement").mockImplementation(((tagName: string) => {
      const el = realCreateElement(tagName);
      if (tagName.toLowerCase() === "a") {
        createdLinks.push(el as HTMLAnchorElement);
      }
      return el;
    }) as typeof document.createElement);

    downloadDocxFromHtml("<html></html>", "resume.doc");
    downloadDocxFromHtml("<html></html>", "resume.docx");

    expect(createdLinks[0]?.download).toBe("resume.doc");
    expect(createdLinks[1]?.download).toBe("resume.docx");
  });

  it("builds ASCII-safe application summaries for exported packages", () => {
    const markdown = buildApplicationSummaryMarkdown({
      id: "pkg-1",
      createdAt: "2026-06-27T00:00:00.000Z",
      updatedAt: "2026-06-27T00:00:00.000Z",
      status: "ready",
      companyName: "Acme",
      jobTitle: "Frontend Engineer",
      jobDescription: "Build UI",
      resumeSnapshot: initialResumeData,
      templateStyle: "modern-01",
      tailorAnalysis: null,
      matchAnalysis: null,
      coverLetter: null,
    });
    expect(markdown).toContain("# Application Package - Acme");
    expect(markdown).not.toContain("\u2014");
  });

  it("can build fallback OOXML blobs for docx export recovery", async () => {
    const blob = await buildResumeOoxmlFallbackBlob(initialResumeData);
    expect(blob.size).toBeGreaterThan(1000);
    expect(blob.type).toContain("wordprocessingml");
  });

  it("keeps docx e2e stub disabled outside the browser harness", () => {
    expect(isE2eExportTrackingEnabled()).toBe(false);
    expect(isE2eDocxStubEnabled()).toBe(false);
  });
});
