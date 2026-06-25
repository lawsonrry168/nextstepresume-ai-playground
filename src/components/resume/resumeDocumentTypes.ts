import type { ResumeData, TemplateStyle } from "../../types";
import type { ResolvedResumeTheme } from "../../lib/resumeThemeCustomization";

/** Shared content props for all resume document renderers (flow, minimalist, marginalia, embedded). */
export interface ResumeDocumentContentProps {
  data: ResumeData;
  templateStyle: TemplateStyle;
  highlightChanges: boolean;
  tailoredSummary?: string;
  tailoredBullets?: { experienceId: string; optimizedBullets: string[] }[];
  matchedKeywords?: string[];
  missingKeywords?: string[];
  highlightMatcherActive?: boolean;
  resolvedTheme?: ResolvedResumeTheme;
}

export type ResumeFlowVariant = "standard" | "minimalist";
