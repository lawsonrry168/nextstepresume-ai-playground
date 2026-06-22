import type { AnalysisResult, ResumeData } from "../types";

/** Apply ATS tailor suggestions (summary + experience bullets) onto resume data. */
export function applyTailorAnalysis(
  resumeData: ResumeData,
  analysis: AnalysisResult
): ResumeData {
  const updatedExperiences = resumeData.experience.map((exp) => {
    const match = analysis.tailoredBulletPoints.find((tb) => tb.experienceId === exp.id);
    if (match?.optimizedBullets?.length) {
      return { ...exp, bullets: match.optimizedBullets };
    }
    return exp;
  });

  return {
    ...resumeData,
    summary: analysis.tailoredSummary || resumeData.summary,
    experience: updatedExperiences,
  };
}
