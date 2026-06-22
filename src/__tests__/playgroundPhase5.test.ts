import { describe, expect, it } from "vitest";
import { calculateResumeStrength } from "../lib/resumeStrengthScore";
import { getRecommendedVerbCategory } from "../lib/actionVerbsCatalog";
import { initialResumeData } from "../data";
import type { ResumeData } from "../types";

const t = (key: string) => key;

describe("resumeStrengthScore", () => {
  it("scores a complete sample resume highly", () => {
    const result = calculateResumeStrength(initialResumeData, t);
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.breakdown).toHaveLength(5);
  });

  it("penalizes empty resume data", () => {
    const empty: ResumeData = {
      ...initialResumeData,
      personalInfo: { ...initialResumeData.personalInfo, name: "", title: "", email: "", phone: "", location: "" },
      summary: "",
      experience: [],
      education: [],
      skills: [],
      projects: [],
    };
    const result = calculateResumeStrength(empty, t);
    expect(result.score).toBeLessThan(20);
  });
});

describe("actionVerbsCatalog", () => {
  it("maps engineering titles to tech verbs", () => {
    expect(getRecommendedVerbCategory("Senior Software Engineer")).toBe("tech");
    expect(getRecommendedVerbCategory("Product Manager")).toBe("leadership");
  });
});
