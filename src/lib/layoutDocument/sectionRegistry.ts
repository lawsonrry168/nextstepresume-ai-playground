/**
 * Canonical resume section identifiers — shared by flow renderer, free-layout studio, and print plan.
 */
export const RESUME_SECTION_IDS = [
  "header",
  "summary",
  "experience",
  "education",
  "projects",
  "skills",
  "certifications",
  "volunteer",
  "languages",
] as const;

export type ResumeSectionId = (typeof RESUME_SECTION_IDS)[number];

export function isResumeSectionId(id: string): id is ResumeSectionId {
  return (RESUME_SECTION_IDS as readonly string[]).includes(id);
}
