import { describe, expect, it } from "vitest";
import { buildResumePdfFilename } from "../lib/resumePdfExportRouter";
import { initialResumeData } from "../data";

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
});
