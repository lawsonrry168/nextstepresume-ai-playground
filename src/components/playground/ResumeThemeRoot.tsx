import React, { CSSProperties, ReactNode } from "react";
import { ResolvedResumeTheme } from "../../lib/resumeThemeCustomization";
import { A4_PAGE_CLASS, A4_PAGE_DATA_ATTR } from "../../lib/a4Page";

export interface ResumeThemeRootProps {
  resolved: ResolvedResumeTheme;
  id?: string;
  className?: string;
  style?: CSSProperties;
  exportPage?: boolean;
  /** Marks print-surface DOM — skip motion flatten during PDF capture */
  exportStatic?: boolean;
  /** Lock sheet to A4 dimensions (794×1123px) — preview & print WYSIWYG */
  a4Surface?: boolean;
  children: ReactNode;
}

function hasVar(cssVars: CSSProperties, key: string): boolean {
  return key in (cssVars as Record<string, string>);
}

export default function ResumeThemeRoot({
  resolved,
  id = "resume-printable-sheet",
  className = "",
  style,
  exportPage = false,
  exportStatic = false,
  a4Surface = false,
  children,
}: ResumeThemeRootProps) {
  const sectionTitleTransform = resolved.uppercaseSectionTitles ? "uppercase" : "none";
  const vars = resolved.cssVars;

  const flagClasses = resolved.active
    ? [
        "resume-custom-active",
        hasVar(vars, "--resume-page-padding") ? "resume-theme-has-padding" : "",
        hasVar(vars, "--resume-sheet-radius") ? "resume-theme-has-sheet-radius" : "",
        hasVar(vars, "--resume-card-radius") ? "resume-theme-has-card-radius" : "",
        hasVar(vars, "--resume-body-font") ? "resume-theme-has-body-font" : "",
        hasVar(vars, "--resume-base-size") ? "resume-theme-has-base-size" : "",
        hasVar(vars, "--resume-line-height") ? "resume-theme-has-line-height" : "",
        hasVar(vars, "--resume-body-color") ? "resume-theme-has-body-color" : "",
        hasVar(vars, "--resume-bg-color") ? "resume-theme-has-bg-color" : "",
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    <div
      id={id}
      className={`resume-theme-root ${a4Surface ? A4_PAGE_CLASS : ""} ${flagClasses} ${className}`.trim()}
      style={{
        ...resolved.cssVars,
        ...style,
        ["--resume-section-title-transform" as string]: sectionTitleTransform,
      }}
      data-theme-custom={resolved.active ? "true" : "false"}
      {...(exportPage ? { "data-resume-export-page": "" } : {})}
      {...(exportStatic ? { "data-export-static": "" } : {})}
      {...(a4Surface ? { [A4_PAGE_DATA_ATTR]: "" } : {})}
    >
      {children}
    </div>
  );
}
