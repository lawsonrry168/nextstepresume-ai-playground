import type { ReactNode } from "react";
import type { TemplateFamily } from "../../lib/resumeTemplateCatalog";
import { isMarginaliaNotebookTemplate } from "../../lib/resumeTemplateCatalog";
import type { TemplateStyle } from "../../types";
import {
  DEFAULT_THEME_CUSTOMIZATION,
  ResolvedResumeTheme,
  resolveResumeTheme,
} from "../../lib/resumeThemeCustomization";
import { a4TemplateFamilyClass } from "../../lib/a4LayoutTokens";
import { getTemplateDefinition, templateDecorClasses } from "../../lib/templates/tokens";
import ResumeThemeRoot from "../playground/ResumeThemeRoot";

export function resolveRendererTheme(style: TemplateStyle, resolvedTheme?: ResolvedResumeTheme) {
  return resolvedTheme ?? resolveResumeTheme(style, DEFAULT_THEME_CUSTOMIZATION);
}

export function buildSheetShellClass(options: {
  style: TemplateStyle;
  family: TemplateFamily;
  resolved: ResolvedResumeTheme;
  layout: "page" | "embedded";
}): string {
  const { style, family, resolved, layout } = options;
  const marginalia = isMarginaliaNotebookTemplate(style);
  const isEmbedded = layout === "embedded";
  const useA4Layout = !isEmbedded;
  const tc = resolved.classes;
  const cssVarKeys = resolved.cssVars as Record<string, string>;
  const hasCssVar = (key: string) => key in cssVarKeys;
  const templateFamilyClass = useA4Layout && !marginalia ? a4TemplateFamilyClass(family) : "";
  let decorClasses = marginalia || !useA4Layout ? "" : templateDecorClasses(getTemplateDefinition(style));
  if (hasCssVar("--resume-bg-color")) {
    decorClasses = decorClasses.replace(/\btpl-paper\b/, "").trim();
  }

  return [
    "shadow-sm border select-text resume-theme-prose",
    marginalia ? "resume-template-marginalia resume-marginalia-ruled border-[#c5d9e8]/70" : "border-slate-200/60 leading-relaxed",
    isEmbedded ? "max-w-full w-full text-[11px]" : `${templateFamilyClass} w-full mx-auto text-sm`,
    useA4Layout && marginalia ? "resume-marginalia-a4-compact" : "",
    isEmbedded && !marginalia ? "leading-relaxed" : "",
    decorClasses,
    hasCssVar("--resume-bg-color") || decorClasses.includes("tpl-paper") ? "" : marginalia ? "" : "bg-white",
    hasCssVar("--resume-sheet-radius") ? "" : "rounded-xl",
    resolved.useCustomPadding || marginalia || useA4Layout ? "" : isEmbedded ? "p-4 md:p-5" : "p-8 md:p-12",
    tc.sheetFont,
    !resolved.active
      ? family === "classic"
        ? "text-slate-900"
        : marginalia
          ? "text-[#1a2438]"
          : "text-slate-800"
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildAccentBarBleedClass(resolved: ResolvedResumeTheme, marginalia: boolean, useA4Layout: boolean, isEmbedded: boolean): string {
  if (resolved.useCustomPadding) {
    return marginalia
      ? "resume-marginalia-accent-bar-bleed resume-theme-accent-bar-bleed"
      : "resume-theme-accent-bar-bleed";
  }
  if (marginalia) return "resume-marginalia-accent-bar-bleed";
  if (useA4Layout) return "resume-a4-accent-bar";
  return isEmbedded ? "-mt-4 md:-mt-5 -mx-4 md:-mx-5" : "-mt-8 md:-mt-12 -mx-8 md:-mx-12";
}

export function ResumeDocumentShell({
  resolved,
  className,
  a4Surface = true,
  accentBar,
  children,
}: {
  resolved: ResolvedResumeTheme;
  className: string;
  a4Surface?: boolean;
  accentBar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <ResumeThemeRoot resolved={resolved} className={className} a4Surface={a4Surface}>
      {accentBar}
      {children}
    </ResumeThemeRoot>
  );
}
