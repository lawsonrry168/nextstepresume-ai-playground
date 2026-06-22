import type { ResumeData } from "../types";

export interface StrengthBreakdownItem {
  id: string;
  label: string;
  weight: number;
  completed: boolean;
  score: number;
  details: string[];
}

export interface ResumeStrengthResult {
  score: number;
  breakdown: StrengthBreakdownItem[];
}

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export function calculateResumeStrength(
  resumeData: ResumeData,
  t: TranslateFn,
): ResumeStrengthResult {
  const breakdown: StrengthBreakdownItem[] = [
    { id: "contact", label: t("strengthGauge.sections.contact"), weight: 20, completed: false, score: 0, details: [] },
    { id: "summary", label: t("strengthGauge.sections.summary"), weight: 15, completed: false, score: 0, details: [] },
    { id: "experience", label: t("strengthGauge.sections.experience"), weight: 30, completed: false, score: 0, details: [] },
    { id: "education", label: t("strengthGauge.sections.education"), weight: 20, completed: false, score: 0, details: [] },
    { id: "skills", label: t("strengthGauge.sections.skills"), weight: 15, completed: false, score: 0, details: [] },
  ];

  const personal = resumeData.personalInfo;
  let contactCompletedCount = 0;
  if (personal.name && personal.name.trim().length > 1) contactCompletedCount++;
  else breakdown[0].details.push(t("strengthGauge.missing.name"));
  if (personal.title && personal.title.trim().length > 1) contactCompletedCount++;
  else breakdown[0].details.push(t("strengthGauge.missing.title"));
  if (personal.email && personal.email.trim().length > 3) contactCompletedCount++;
  else breakdown[0].details.push(t("strengthGauge.missing.email"));
  if (personal.phone && personal.phone.trim().length > 3) contactCompletedCount++;
  else breakdown[0].details.push(t("strengthGauge.missing.phone"));
  if (personal.location && personal.location.trim().length > 2) contactCompletedCount++;
  else breakdown[0].details.push(t("strengthGauge.missing.location"));
  breakdown[0].score = Math.round((contactCompletedCount / 5) * 20);
  breakdown[0].completed = contactCompletedCount === 5;

  const sumVal = resumeData.summary || "";
  if (sumVal.trim().length >= 100) {
    breakdown[1].score = 15;
    breakdown[1].completed = true;
  } else if (sumVal.trim().length > 0) {
    breakdown[1].score = 8;
    breakdown[1].details.push(t("strengthGauge.details.summaryBrief"));
  } else {
    breakdown[1].score = 0;
    breakdown[1].details.push(t("strengthGauge.details.summaryMissing"));
  }

  const expList = resumeData.experience || [];
  if (expList.length === 0) {
    breakdown[2].score = 0;
    breakdown[2].details.push(t("strengthGauge.details.experienceEmpty"));
  } else {
    let experienceItemTotal = 0;
    const experienceItemWeight = 30 / Math.max(1, expList.length);
    expList.forEach((exp) => {
      let itemScore = 0;
      if (exp.company && exp.company.trim().length > 0) itemScore += 2;
      if (exp.role && exp.role.trim().length > 0) itemScore += 2;
      if (exp.startDate && exp.startDate.trim().length > 0) itemScore += 1;
      const bulletsCount = exp.bullets ? exp.bullets.filter((b) => b && b.trim().length > 10).length : 0;
      if (bulletsCount >= 3) {
        itemScore += 5;
      } else if (bulletsCount > 0) {
        itemScore += bulletsCount * 1.5;
        breakdown[2].details.push(
          t("strengthGauge.details.experienceBullets", {
            role: exp.role || t("editor.fields.role"),
            company: exp.company || t("editor.fields.company"),
          }),
        );
      } else {
        breakdown[2].details.push(
          t("strengthGauge.details.experienceBulletsMissing", {
            role: exp.role || t("editor.fields.role"),
            company: exp.company || t("editor.fields.company"),
          }),
        );
      }
      experienceItemTotal += (itemScore / 10) * experienceItemWeight;
    });
    breakdown[2].score = Math.round(Math.min(30, experienceItemTotal));
    breakdown[2].completed = breakdown[2].score >= 26;
  }

  const eduList = resumeData.education || [];
  if (eduList.length === 0) {
    breakdown[3].score = 0;
    breakdown[3].details.push(t("strengthGauge.details.educationEmpty"));
  } else {
    let educationTotal = 0;
    const educationWeight = 20 / Math.max(1, eduList.length);
    eduList.forEach((edu) => {
      let itemScore = 0;
      if (edu.institution && edu.institution.trim().length > 0) itemScore += 4;
      if (edu.degree && edu.degree.trim().length > 0) itemScore += 3;
      if (edu.field && edu.field.trim().length > 0) itemScore += 3;
      educationTotal += (itemScore / 10) * educationWeight;
    });
    breakdown[3].score = Math.round(educationTotal);
    breakdown[3].completed = breakdown[3].score >= 16;
  }

  const skillsList = resumeData.skills || [];
  if (skillsList.length >= 6) {
    breakdown[4].score = 15;
    breakdown[4].completed = true;
  } else if (skillsList.length >= 3) {
    breakdown[4].score = 10;
    breakdown[4].details.push(t("strengthGauge.details.skillsTarget"));
  } else if (skillsList.length > 0) {
    breakdown[4].score = 5;
    breakdown[4].details.push(t("strengthGauge.details.skillsNarrow"));
  } else {
    breakdown[4].score = 0;
    breakdown[4].details.push(t("strengthGauge.details.skillsEmpty"));
  }

  const score = Math.min(100, Math.max(0, breakdown.reduce((sum, item) => sum + item.score, 0)));
  return { score, breakdown };
}
