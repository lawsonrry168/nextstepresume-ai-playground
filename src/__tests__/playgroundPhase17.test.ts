import { describe, expect, it } from "vitest";
import { buildResumePdfFilename } from "../lib/resumePdfExportRouter";
import { initialResumeData } from "../data";
import { isE2eExportTrackingEnabled, isE2ePdfStubEnabled } from "../lib/e2eExportTrack";

describe("phase 17 pdf export helpers", () => {
  it("builds a stable pdf filename from resume name", () => {
    const filename = buildResumePdfFilename(initialResumeData);
    expect(filename).toMatch(/^NextStepResume_.+\.pdf$/);
    expect(filename).not.toContain(" ");
  });

  it("falls back when resume name is blank", () => {
    expect(
      buildResumePdfFilename({
        ...initialResumeData,
        personalInfo: { ...initialResumeData.personalInfo, name: "   " },
      }),
    ).toBe("NextStepResume_ATS_Resume.pdf");
  });

  it("keeps e2e export hooks disabled outside the browser harness", () => {
    expect(isE2eExportTrackingEnabled()).toBe(false);
    expect(isE2ePdfStubEnabled()).toBe(false);
  });
});
