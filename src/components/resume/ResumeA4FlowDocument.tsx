import { memo } from "react";
import { AnalysisResult } from "../../types";
import { buildFreeLayoutSections } from "../../lib/resumeFreeLayout";
import ResumeSectionRenderer, { type ResumeSectionRendererProps } from "./ResumeSectionRenderer";
import type { ResumeDocumentContentProps } from "./resumeDocumentTypes";

export interface ResumeA4FlowDocumentProps extends ResumeDocumentContentProps {
  analysisResult?: AnalysisResult | null;
}

function ResumeA4FlowDocument({
  data,
  templateStyle,
  highlightChanges,
  analysisResult = null,
  tailoredSummary,
  tailoredBullets,
  matchedKeywords = [],
  missingKeywords = [],
  highlightMatcherActive = false,
  resolvedTheme,
}: ResumeA4FlowDocumentProps) {
  const sections = buildFreeLayoutSections(data);

  const sectionProps: Omit<ResumeSectionRendererProps, "sectionId"> = {
    data,
    highlightChanges,
    analysisResult,
    templateStyle,
    resolvedTheme,
    mode: "flow",
    flowVariant: "standard",
    tailoredSummary,
    tailoredBullets,
    matchedKeywords,
    missingKeywords,
    highlightMatcherActive,
  };

  return (
    <div className="resume-a4-flow">
      {sections.map((section) => (
        <ResumeSectionRenderer key={section.id} sectionId={section.id} {...sectionProps} />
      ))}
    </div>
  );
}

export default memo(ResumeA4FlowDocument);
