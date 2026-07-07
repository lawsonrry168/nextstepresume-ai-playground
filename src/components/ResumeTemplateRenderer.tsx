/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { memo } from "react";
import { ResumeData, TemplateStyle } from "../types";
import { getTemplateFamily, isMarginaliaNotebookTemplate } from "../lib/resumeTemplateCatalog";
import { getTemplateDefinition } from "../lib/templates/tokens";
import { ResolvedResumeTheme } from "../lib/resumeThemeCustomization";
import ResumeA4FlowDocument from "./resume/ResumeA4FlowDocument";
import ResumeA4MinimalistDocument from "./resume/ResumeA4MinimalistDocument";
import ResumeMarginaliaDocument from "./resume/ResumeMarginaliaDocument";
import {
  ResumeEmbeddedClassic,
  ResumeEmbeddedMinimalist,
  ResumeEmbeddedModern,
} from "./resume/ResumeEmbeddedLayouts";
import {
  buildAccentBarBleedClass,
  buildSheetShellClass,
  resolveRendererTheme,
  ResumeDocumentShell,
} from "./resume/resumeTemplateShell";

interface ResumeTemplateRendererProps {
  data: ResumeData;
  style: TemplateStyle;
  highlightChanges: boolean;
  tailoredSummary?: string;
  tailoredBullets?: { experienceId: string; optimizedBullets: string[] }[];
  matchedKeywords?: string[];
  missingKeywords?: string[];
  highlightMatcherActive?: boolean;
  resolvedTheme?: ResolvedResumeTheme;
  /** page = 標準預覽；embedded = 三欄比較等窄欄位 */
  layout?: "page" | "embedded";
}

function ResumeTemplateRenderer({
  data,
  style,
  highlightChanges,
  tailoredSummary,
  tailoredBullets,
  matchedKeywords = [],
  missingKeywords = [],
  highlightMatcherActive = false,
  resolvedTheme,
  layout = "page",
}: ResumeTemplateRendererProps) {
  const family = getTemplateFamily(style);
  const marginalia = isMarginaliaNotebookTemplate(style);
  const isEmbedded = layout === "embedded";
  const useA4Layout = !isEmbedded;
  const resolved = resolveRendererTheme(style, resolvedTheme);
  const tc = resolved.classes;
  const sheetShellClass = buildSheetShellClass({ style, family, resolved, layout });
  const accentBarBleedClass = buildAccentBarBleedClass(resolved, marginalia, useA4Layout, isEmbedded);

  const contentProps = {
    data,
    templateStyle: style,
    highlightChanges,
    tailoredSummary,
    tailoredBullets,
    matchedKeywords,
    missingKeywords,
    highlightMatcherActive,
    resolvedTheme: resolved,
    resolved,
  };

  // Layout archetype from the template tokens decides the document component,
  // so sidebar designs get a real sidebar regardless of legacy family.
  const archetype = getTemplateDefinition(style).layout;
  const usesSidebar = archetype === "sidebar-left" || archetype === "sidebar-right";
  const usesTwoColumn = archetype === "two-column";

  if (useA4Layout && !marginalia && usesSidebar) {
    return (
      <ResumeDocumentShell resolved={resolved} className={sheetShellClass} a4Surface>
        <ResumeA4MinimalistDocument {...contentProps} />
      </ResumeDocumentShell>
    );
  }

  if (useA4Layout && !marginalia && usesTwoColumn) {
    return (
      <ResumeDocumentShell resolved={resolved} className={sheetShellClass} a4Surface>
        <ResumeA4MinimalistDocument {...contentProps} />
      </ResumeDocumentShell>
    );
  }

  if (useA4Layout && !marginalia) {
    return (
      <ResumeDocumentShell
        resolved={resolved}
        className={sheetShellClass}
        a4Surface
        accentBar={
          family === "modern" && resolved.showAccentBar ? (
            <div className={`${tc.accentBar} ${accentBarBleedClass}`} />
          ) : null
        }
      >
        <ResumeA4FlowDocument {...contentProps} />
      </ResumeDocumentShell>
    );
  }

  if (marginalia) {
    return (
      <ResumeDocumentShell
        resolved={resolved}
        className={sheetShellClass}
        a4Surface={!isEmbedded}
        accentBar={
          resolved.showAccentBar ? (
            <div
              className={`${tc.accentBar} resume-marginalia-accent-bar resume-marginalia-accent-bar-fill ${accentBarBleedClass}`}
            />
          ) : null
        }
      >
        <ResumeMarginaliaDocument {...contentProps} />
      </ResumeDocumentShell>
    );
  }

  if (isEmbedded) {
    const EmbeddedContent =
      family === "classic"
        ? ResumeEmbeddedClassic
        : family === "modern"
          ? ResumeEmbeddedModern
          : ResumeEmbeddedMinimalist;

    return (
      <ResumeDocumentShell
        resolved={resolved}
        className={sheetShellClass}
        a4Surface={false}
        accentBar={
          family === "modern" && resolved.showAccentBar ? (
            <div className={`${tc.accentBar} h-2.5 mb-8 rounded-t-xl ${accentBarBleedClass}`} />
          ) : null
        }
      >
        <EmbeddedContent {...contentProps} />
      </ResumeDocumentShell>
    );
  }

  return (
    <ResumeDocumentShell resolved={resolved} className={sheetShellClass} a4Surface>
      <ResumeA4FlowDocument {...contentProps} />
    </ResumeDocumentShell>
  );
}

export default memo(ResumeTemplateRenderer);
