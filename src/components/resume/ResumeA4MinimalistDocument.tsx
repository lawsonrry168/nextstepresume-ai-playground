import { memo, useMemo } from "react";
import MinimalistA4Sidebar from "./MinimalistA4Sidebar";
import ResumeSectionRenderer from "./ResumeSectionRenderer";
import type { ResumeDocumentContentProps } from "./resumeDocumentTypes";

const MINIMALIST_MAIN_SECTIONS = ["summary", "experience", "volunteer", "projects"] as const;

function ResumeA4MinimalistDocument(props: ResumeDocumentContentProps) {
  const {
    data,
    templateStyle,
    highlightChanges,
    tailoredSummary,
    tailoredBullets,
    matchedKeywords = [],
    missingKeywords = [],
    highlightMatcherActive = false,
    resolvedTheme,
  } = props;

  const mainSectionIds = useMemo(
    () =>
      MINIMALIST_MAIN_SECTIONS.filter((id) => {
        switch (id) {
          case "summary":
            return Boolean(data.summary?.trim());
          case "experience":
            return data.experience.length > 0;
          case "volunteer":
            return Boolean(data.volunteerWork?.length);
          case "projects":
            return data.projects.length > 0;
          default:
            return false;
        }
      }),
    [data],
  );

  const sectionProps = {
    data,
    highlightChanges,
    analysisResult: null,
    templateStyle,
    resolvedTheme,
    mode: "flow" as const,
    flowVariant: "minimalist" as const,
    tailoredSummary,
    tailoredBullets,
    matchedKeywords,
    missingKeywords,
    highlightMatcherActive,
  };

  return (
    <div className="resume-a4-minimalist-grid">
      <MinimalistA4Sidebar {...props} />
      <div className="resume-a4-minimalist-main resume-theme-prose">
        {mainSectionIds.map((sectionId) => (
          <ResumeSectionRenderer key={sectionId} sectionId={sectionId} {...sectionProps} />
        ))}
      </div>
    </div>
  );
}

export default memo(ResumeA4MinimalistDocument);
