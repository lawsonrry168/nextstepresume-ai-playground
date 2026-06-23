import { describe, expect, it } from "vitest";
import { buildResumeDocxHtml } from "../lib/resumeDocxExport";
import { initialResumeData } from "../data";
import { isE2eDocxStubEnabled, isE2eExportTrackingEnabled } from "../lib/e2eExportTrack";

describe("phase 18 docx export helpers", () => {
  it("builds word-compatible html with resume name", () => {
    const html = buildResumeDocxHtml(initialResumeData);
    expect(html).toContain(initialResumeData.personalInfo.name);
    expect(html).toContain("xmlns:w='urn:schemas-microsoft-com:office:word'");
  });

  it("keeps docx e2e stub disabled outside the browser harness", () => {
    expect(isE2eExportTrackingEnabled()).toBe(false);
    expect(isE2eDocxStubEnabled()).toBe(false);
  });
});
