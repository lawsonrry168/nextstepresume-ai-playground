/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode, memo } from "react";
import { ResumeData, TemplateStyle } from "../types";
import { getResumeTemplateTheme, getTemplateFamily, isMarginaliaNotebookTemplate } from "../lib/resumeTemplateCatalog";
import {
  DEFAULT_THEME_CUSTOMIZATION,
  ResolvedResumeTheme,
  resolveResumeTheme,
} from "../lib/resumeThemeCustomization";
import ResumeThemeRoot from "./playground/ResumeThemeRoot";
import { Mail, Phone, Globe, MapPin, Linkedin, Sparkles, AlertCircle, TrendingUp } from "lucide-react";
import { t } from "../i18n/translate";
import { getHkPersonalMetaLines } from "../lib/resumeHkMeta";

// Subordinate helper for exact-match highlighting
function highlightKeywordsInString(text: string, matched: string[], marginalia = false): ReactNode {
  if (!text || matched.length === 0) return text;

  // Filter out empty triggers
  const validKeywords = matched.filter(Boolean);
  if (validKeywords.length === 0) return text;

  // Sort keywords by length descending to match longer multi-word phrases first
  const sorted = [...validKeywords].sort((a, b) => b.length - a.length);

  // Escape special characters to form a valid safe RegExp
  const CleanRegex = sorted.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
  
  // RegExp looking for keyword bounds
  const regex = new RegExp(`\\b(${CleanRegex.join('|')})\\b`, 'gi');
  
  const tokens = text.split(regex);
  if (tokens.length <= 1) return text;

  return (
    <>
      {tokens.map((token, idx) => {
        const isMatch = sorted.some(
          word => word.toLowerCase() === token.toLowerCase()
        );
        if (isMatch) {
          return (
            <mark
              key={idx}
              className={
                marginalia
                  ? "bg-[#f5d76e]/75 text-[#1a2438] font-semibold px-0.5 rounded cursor-default"
                  : "bg-emerald-100 text-emerald-950 border-b-2 border-emerald-400 font-semibold px-0.5 rounded cursor-default"
              }
              title="Matched Keyword!"
            >
              {token}
            </mark>
          );
        }
        return token;
      })}
    </>
  );
}

// Helper to render bold (**text**) and italic (*text*) formatting, with optional keyword highlights
function renderFormattedText(
  text: string | undefined,
  matchedKeywords: string[] = [],
  highlightMatcherActive: boolean = false,
  marginalia = false,
): ReactNode {
  if (!text) return null;
  // Splits by **bold** or *italic* patterns
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return (
    <>
      {parts.map((part, idx) => {
        let isBold = false;
        let isItalic = false;
        let innerText = part;

        if (part.startsWith('**') && part.endsWith('**')) {
          innerText = part.slice(2, -2);
          isBold = true;
        } else if (part.startsWith('*') && part.endsWith('*')) {
          innerText = part.slice(1, -1);
          isItalic = true;
        }

        let content: ReactNode = innerText;

        if (highlightMatcherActive && matchedKeywords.length > 0) {
          content = highlightKeywordsInString(innerText, matchedKeywords, marginalia);
        }

        if (isBold) {
          return <strong key={idx} className="font-bold">{content}</strong>;
        } else if (isItalic) {
          return <em key={idx} className="italic">{content}</em>;
        }
        return <span key={idx}>{content}</span>;
      })}
    </>
  );
}

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
  
  // Local wrapper closes over matchedKeywords and highlightMatcherActive
  const renderText = (text: string | undefined) => {
    return renderFormattedText(text, matchedKeywords, highlightMatcherActive, marginalia);
  };
  
  // Resolve summary (AI vs raw)
  const displaySummary = (highlightChanges && tailoredSummary) ? tailoredSummary : data.summary;

  // Resolve bullets for an experience item
  const getDisplayBullets = (expId: string, originalBullets: string[]) => {
    if (highlightChanges && tailoredBullets) {
      const match = tailoredBullets.find(tb => tb.experienceId === expId);
      if (match && match.optimizedBullets && match.optimizedBullets.length > 0) {
        return match.optimizedBullets;
      }
    }
    return originalBullets;
  };

  const isTailoredBullet = (expId: string): boolean => {
    if (!highlightChanges || !tailoredBullets) return false;
    return tailoredBullets.some(tb => tb.experienceId === expId);
  };

  // Render sub-block for missing keywords/skills (e.g. in Skills section)
  const renderMissingSkillsBlock = () => {
    if (!highlightMatcherActive || !missingKeywords || missingKeywords.length === 0) return null;
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 my-3 text-left no-print font-sans shadow-sm" id="skills-match-gap-box">
        <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>⚠️ {t("resumeLivePreview.matchGapsTitle")}</span>
        </div>
        <p className="text-[10px] text-slate-600 leading-normal mt-1">
          These key technical skills are requested by the target Job Description, but missing in your resume. Try adding them to rank higher:
        </p>
        <div className="flex flex-wrap gap-1 mt-2">
          {missingKeywords.map(w => (
            <span key={w} className="bg-rose-100/90 hover:bg-rose-200 text-rose-800 text-[9px] font-bold px-2 py-0.5 rounded border border-rose-200/85 flex items-center gap-1 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              {w}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const theme = getResumeTemplateTheme(style);
  const family = getTemplateFamily(style);
  const marginalia = isMarginaliaNotebookTemplate(style);
  const resolved = resolvedTheme ?? resolveResumeTheme(style, DEFAULT_THEME_CUSTOMIZATION);
  const tc = resolved.classes;
  const cssVarKeys = resolved.cssVars as Record<string, string>;
  const hasCssVar = (key: string) => key in cssVarKeys;
  const nameClass = [
    hasCssVar("--resume-name-size") || hasCssVar("--resume-heading-font") || hasCssVar("--resume-heading-color")
      ? "resume-theme-name"
      : "",
    tc.nameClass,
  ]
    .filter(Boolean)
    .join(" ");
  const sectionHeadingClass = tc.sectionHeading;
  const sectionBorderClass = tc.sectionBorder;
  const h2Modern = (extra = "") =>
    marginalia
      ? `text-xs font-bold uppercase tracking-wider ${sectionHeadingClass} resume-marginalia-h2 ${extra}`.trim()
      : `text-xs font-bold uppercase tracking-wider ${sectionHeadingClass} ${sectionBorderClass} ${extra}`.trim();
  const h2Classic = (extra = "") =>
    `text-xs font-bold uppercase tracking-wider ${tc.accentText} font-sans pb-0.5 ${sectionBorderClass} ${extra}`.trim();
  const cardClass = [
    hasCssVar("--resume-card-bg") || hasCssVar("--resume-border-color") ? "resume-theme-card" : "",
    marginalia ? "resume-marginalia-card p-3" : "bg-slate-50 p-3 border border-slate-100",
    hasCssVar("--resume-card-radius") ? "" : "rounded-lg",
  ]
    .filter(Boolean)
    .join(" ");
  const educationCardClass = marginalia
    ? [
        hasCssVar("--resume-card-bg") || hasCssVar("--resume-border-color") ? "resume-theme-card" : "resume-marginalia-card resume-marginalia-card--mint",
        "resume-marginalia-card-ruled",
        hasCssVar("--resume-card-radius") ? "" : "rounded-lg",
      ]
        .filter(Boolean)
        .join(" ")
    : cardClass;
  const projectCardClass = marginalia
    ? [
        hasCssVar("--resume-card-bg") || hasCssVar("--resume-border-color") ? "resume-theme-card" : "resume-marginalia-card resume-marginalia-card--marker",
        "resume-marginalia-card-ruled",
        hasCssVar("--resume-card-radius") ? "" : "rounded-lg",
      ]
        .filter(Boolean)
        .join(" ")
    : cardClass;
  const sectionDividerClass = marginalia ? "border-[#c5d9e8]/70" : "border-slate-100";
  const marginaliaStack = marginalia ? "resume-marginalia-stack" : "gap-3";
  const marginaliaSubsection = marginalia
    ? "resume-marginalia-subsection"
    : `space-y-2 pt-2 border-t ${sectionDividerClass}`;
  const marginaliaChipMint = marginalia ? "resume-marginalia-chip resume-marginalia-chip--mint" : "text-xs px-2.5 py-1 rounded font-medium border";
  const marginaliaChipMarker = marginalia ? "resume-marginalia-chip resume-marginalia-chip--marker" : "text-xs px-2.5 py-1 rounded font-semibold border";
  const marginaliaChipRow = marginalia ? "resume-marginalia-chip-row" : "flex flex-wrap gap-1.5";
  const ruledLine = marginalia ? "resume-marginalia-ruled-line" : "leading-relaxed";
  const isEmbedded = layout === "embedded";
  const sheetShellClass = [
    "shadow-sm border select-text resume-theme-prose",
    marginalia ? "resume-template-marginalia resume-marginalia-ruled border-[#c5d9e8]/70" : "border-slate-200/60 leading-relaxed",
    isEmbedded ? "max-w-full w-full text-[11px]" : "max-w-[800px] mx-auto text-sm",
    isEmbedded && !marginalia ? "leading-relaxed" : "",
    hasCssVar("--resume-bg-color") ? "" : marginalia ? "" : "bg-white",
    hasCssVar("--resume-sheet-radius") ? "" : "rounded-xl",
    resolved.useCustomPadding || marginalia ? "" : isEmbedded ? "p-4 md:p-5" : "p-8 md:p-12",
    tc.sheetFont,
    !resolved.active ? (family === "classic" ? "text-slate-900" : marginalia ? "text-[#1a2438]" : "text-slate-800") : "",
  ]
    .filter(Boolean)
    .join(" ");
  const sectionStackClass = marginalia
    ? "resume-marginalia-section-stack resume-theme-prose"
    : [
        resolved.useCustomSectionGap ? "resume-theme-section-stack" : "space-y-6",
        "resume-theme-prose",
      ].join(" ");
  const accentBarBleedClass = resolved.useCustomPadding
    ? marginalia
      ? "resume-marginalia-accent-bar-bleed resume-theme-accent-bar-bleed"
      : "resume-theme-accent-bar-bleed"
    : marginalia
      ? "resume-marginalia-accent-bar-bleed"
      : isEmbedded
        ? "-mt-4 md:-mt-5 -mx-4 md:-mx-5"
        : "-mt-8 md:-mt-12 -mx-8 md:-mx-12";
  const tailoredSummaryClass = highlightChanges && tailoredSummary
    ? resolved.active
      ? `${tc.tailoredBg} border-l-4 ${tc.tailoredBorder} pl-2.5 py-1 text-slate-900 inline-block w-full`
      : "bg-amber-50 border-l-2 border-amber-400 pl-2.5 py-1 text-slate-900 inline-block w-full"
    : "";

  // Render Classic Style (Times New Roman / Georgia vibe)
  if (family === "classic") {
    return (
      <ResumeThemeRoot resolved={resolved} className={sheetShellClass}>
        {/* Header */}
        <div className={`text-center space-y-2 border-b ${tc.headerBorder} pb-4 mb-6`}>
          <h1 className={`text-2xl md:text-3xl font-bold text-slate-900 ${nameClass}`}>
            {data.personalInfo.name}
          </h1>
          <p className="text-xs md:text-sm font-medium italic text-slate-600">
            {data.personalInfo.title}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-sans mt-2">
            {data.personalInfo.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {data.personalInfo.email}</span>}
            {data.personalInfo.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {data.personalInfo.phone}</span>}
            {data.personalInfo.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {data.personalInfo.location}</span>}
            {data.personalInfo.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {data.personalInfo.website}</span>}
            {data.personalInfo.linkedin && <span className="flex items-center gap-1"><Linkedin className="w-3 h-3" /> {data.personalInfo.linkedin}</span>}
            {getHkPersonalMetaLines(data.personalInfo).map((line) => (
              <span key={line} className="flex items-center gap-1 text-[10px] opacity-90">{line}</span>
            ))}
          </div>
        </div>

        {/* Professional Summary */}
        {displaySummary && (
          <div className="mb-6 space-y-1.5">
            <h2 className={h2Classic()}>
              Professional Summary
            </h2>
            <p className={`text-xs md:text-sm leading-relaxed text-slate-705 ${highlightChanges && tailoredSummary ? "bg-amber-50 border-l-2 border-amber-400 pl-2.5 py-1 text-slate-900 inline-block w-full" : ""}`}>
              {renderText(displaySummary)}
            </p>
          </div>
        )}

        {/* Work Experience */}
        {data.experience && data.experience.length > 0 && (
          <div className="mb-6 space-y-3">
            <h2 className={h2Classic()}>
              Professional Experience
            </h2>
            <div className="space-y-4">
              {data.experience.map((exp) => {
                const bullets = getDisplayBullets(exp.id, exp.bullets);
                const isOptimized = isTailoredBullet(exp.id);
                return (
                  <div key={exp.id} className="space-y-1">
                    <div className="flex justify-between items-baseline text-xs md:text-sm">
                      <span className="font-bold text-slate-900">{exp.company}</span>
                      <span className="text-slate-600 italic font-sans">{exp.startDate} – {exp.endDate}</span>
                    </div>
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="italic font-semibold text-slate-700">{exp.role}</span>
                      <span className="text-slate-500 font-sans">{exp.location}</span>
                    </div>
                    <ul className={`list-disc list-outside pl-4 space-y-1 text-xs text-slate-700 mt-1.5 ${isOptimized ? "bg-emerald-50/55 pl-6 py-1.5 border-l-2 border-emerald-400 rounded-r" : ""}`}>
                      {bullets.map((bullet, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {renderText(bullet)}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <div className="mb-6 space-y-2">
            <h2 className={h2Classic()}>
              Education
            </h2>
            <div className="space-y-2">
              {data.education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline text-xs">
                  <div>
                    <span className="font-bold text-slate-950">{edu.institution}</span>
                    <span className="text-slate-600"> — {edu.degree} in {edu.field}</span>
                  </div>
                  <span className="text-slate-500 font-sans shrink-0">{edu.gradDate}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <div className="mb-6 space-y-2">
            <h2 className={h2Classic()}>
              Key Projects
            </h2>
            <div className="space-y-3">
              {data.projects.map((proj) => (
                <div key={proj.id} className="space-y-0.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{proj.name}</span>
                    {proj.url && <span className="text-slate-500 italic font-sans break-all max-w-[200px] text-right">{proj.url}</span>}
                  </div>
                  <p className="text-slate-650 italic">Tech Stack: {proj.techStack}</p>
                  <p className="text-slate-700 leading-relaxed">{renderText(proj.description)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications optional section */}
        {data.certifications && data.certifications.length > 0 && (
          <div className="mb-6 space-y-1.5">
            <h2 className={h2Classic()}>
              Certifications & Credentials
            </h2>
            <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700">
              {data.certifications.map((cert, idx) => (
                <li key={idx} className="leading-relaxed">{renderText(cert)}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Volunteer Work optional section */}
        {data.volunteerWork && data.volunteerWork.length > 0 && (
          <div className="mb-6 space-y-1.5">
            <h2 className={h2Classic()}>
              Volunteer Work & Service
            </h2>
            <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700">
              {data.volunteerWork.map((vol, idx) => (
                <li key={idx} className="leading-relaxed">{renderText(vol)}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Languages optional section */}
        {data.languages && data.languages.length > 0 && (
          <div className="mb-6 space-y-1.5">
            <h2 className={h2Classic()}>
              Languages
            </h2>
            <p className="text-xs text-slate-705 leading-relaxed font-sans">
              {data.languages.join(", ")}
            </p>
          </div>
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <div className="space-y-1.5">
            <h2 className={h2Classic()}>
              Technical Credentials
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              <strong>Skills:</strong> {data.skills.join(", ")}
            </p>
            {renderMissingSkillsBlock()}
          </div>
        )}
      </ResumeThemeRoot>
    );
  }

  // Render Modern Style (Inter / Slate / Professional High-Contrast layout)
  if (family === "modern") {
    return (
      <ResumeThemeRoot resolved={resolved} className={sheetShellClass}>
        {resolved.showAccentBar ? (
          <div
            className={`${tc.accentBar} ${marginalia ? "resume-marginalia-accent-bar resume-marginalia-accent-bar-fill" : "h-2.5 mb-8"} rounded-t-xl ${accentBarBleedClass}`}
          />
        ) : null}

        <div
          className={
            marginalia
              ? "resume-marginalia-header resume-marginalia-header-row"
              : "flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6 pb-6 border-b border-slate-200"
          }
        >
          <div className={marginalia ? "resume-marginalia-header-identity" : undefined}>
            <h1
              className={`${marginalia ? "text-3xl md:text-4xl font-bold resume-marginalia-name" : "text-3xl font-extrabold tracking-tight text-slate-900"} ${nameClass}`}
            >
              {data.personalInfo.name}
            </h1>
            <p className={`text-sm font-semibold ${tc.accentText} uppercase tracking-wider ${marginalia ? ruledLine : "mt-1"}`}>
              {data.personalInfo.title}
            </p>
          </div>
          <div
            className={
              marginalia
                ? "resume-marginalia-header-contact"
                : "space-y-1 text-slate-500 text-xs text-left md:text-right shrink-0"
            }
          >
            {data.personalInfo.email && (
              <div className={`${marginalia ? "resume-marginalia-contact-row md:justify-end" : "flex items-center md:justify-end gap-1.5"}`}>
                <Mail className={`w-3.5 h-3.5 shrink-0 ${tc.accentText}`} /> {data.personalInfo.email}
              </div>
            )}
            {data.personalInfo.phone && (
              <div className={`${marginalia ? "resume-marginalia-contact-row md:justify-end" : "flex items-center md:justify-end gap-1.5"}`}>
                <Phone className={`w-3.5 h-3.5 shrink-0 ${tc.accentText}`} /> {data.personalInfo.phone}
              </div>
            )}
            {data.personalInfo.location && (
              <div className={`${marginalia ? "resume-marginalia-contact-row md:justify-end" : "flex items-center md:justify-end gap-1.5"}`}>
                <MapPin className={`w-3.5 h-3.5 shrink-0 ${tc.accentText}`} /> {data.personalInfo.location}
              </div>
            )}
            {data.personalInfo.website && (
              <div className={`${marginalia ? "resume-marginalia-contact-row md:justify-end" : "flex items-center md:justify-end gap-1.5"}`}>
                <Globe className={`w-3.5 h-3.5 shrink-0 ${tc.accentText}`} /> {data.personalInfo.website}
              </div>
            )}
            {data.personalInfo.linkedin && (
              <div className={`${marginalia ? "resume-marginalia-contact-row md:justify-end" : "flex items-center md:justify-end gap-1.5"}`}>
                <Linkedin className={`w-3.5 h-3.5 shrink-0 ${tc.accentText}`} /> {data.personalInfo.linkedin}
              </div>
            )}
            {getHkPersonalMetaLines(data.personalInfo).map((line) => (
              <div key={line} className={`text-[10px] ${marginalia ? "resume-marginalia-contact-row md:justify-end" : "flex md:justify-end opacity-90"}`}>
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* Content Stream */}
        <div className={sectionStackClass}>
          {/* Summary */}
          {displaySummary && (
            <div className={marginalia ? "space-y-0" : "space-y-2"}>
              <h2 className={h2Modern("flex items-center gap-2")}>
                Professional Profile
                {(highlightChanges && tailoredSummary) && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-mono font-normal">AI Tailored</span>}
              </h2>
              <p className={`text-sm ${ruledLine} ${marginalia ? "font-serif text-[#1a2438]" : "text-slate-700 font-sans leading-relaxed"} ${highlightChanges && tailoredSummary ? (marginalia ? `${tc.tailoredBg} p-3 rounded-lg border-l-4 ${tc.tailoredBorder}` : "bg-amber-50 p-3 rounded-lg border-l-4 border-amber-500 text-slate-900") : ""}`}>
                {renderText(displaySummary)}
              </p>
            </div>
          )}

          {/* Experience */}
          {data.experience && data.experience.length > 0 && (
            <div className={marginalia ? "flex flex-col resume-marginalia-stack" : "space-y-4"}>
              <h2 className={h2Modern()}>Employment Experience</h2>
              <div className={marginalia ? "flex flex-col resume-marginalia-stack" : "space-y-5"}>
                {data.experience.map((exp) => {
                  const bullets = getDisplayBullets(exp.id, exp.bullets);
                  const isOptimized = isTailoredBullet(exp.id);
                  return (
                    <div key={exp.id} className="relative pl-0">
                      {marginalia ? (
                        <div className="resume-marginalia-job-block">
                          <h3 className="font-bold text-slate-900 min-w-0 resume-marginalia-job-title text-sm">
                            <span>{exp.role}</span>
                            <span className="text-slate-400 font-normal"> at </span>
                            <span className={`${tc.accentText} font-bold`}>{exp.company}</span>
                          </h3>
                          <div className={`text-xs font-semibold text-slate-400 uppercase tracking-wider ${ruledLine}`}>
                            {exp.startDate} – {exp.endDate}
                          </div>
                          <div className={`text-xs text-slate-500 ${ruledLine}`}>{exp.location}</div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4">
                            <h3 className="font-bold text-slate-900 min-w-0 flex-1 text-base">
                              <span className="inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                                <span>{exp.role}</span>
                                <span className="text-slate-400 font-normal">at</span>
                                <span className={`${tc.accentText} font-bold`}>{exp.company}</span>
                              </span>
                            </h3>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 whitespace-nowrap">
                              {exp.startDate} – {exp.endDate}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mb-1.5">{exp.location}</div>
                        </>
                      )}
                      
                      <ul className={`text-xs text-slate-600 ${marginalia ? "resume-marginalia-list" : "list-disc pl-5 md:text-sm space-y-1.5"} ${isOptimized ? `${tc.expHighlightBg} p-3.5 border-l-4 ${tc.expHighlightBorder} rounded-r-lg text-slate-800` : ""}`}>
                        {bullets.map((b, i) => (
                          <li key={i} className={ruledLine}>{renderText(b)}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dual Columns: Education and projects */}
          {(() => {
            const hasEdu = !!(data.education && data.education.length > 0);
            const hasProj = !!(data.projects && data.projects.length > 0);
            if (!hasEdu && !hasProj) return null;

            const renderEducationCards = () =>
              data.education!.map((edu) => (
                <div
                  key={edu.id}
                  className={`${educationCardClass} flex-1 flex flex-col justify-start ${marginalia ? "" : "min-h-[5.5rem]"}`}
                >
                  <h4 className={`font-bold text-slate-900 text-sm ${marginalia ? ruledLine : ""}`}>{edu.institution}</h4>
                  <p className={`text-xs text-slate-700 font-semibold ${marginalia ? ruledLine : ""}`}>{edu.degree} in {edu.field}</p>
                  <p className={`text-[10px] text-slate-400 font-mono ${marginalia ? ruledLine : "mt-0.5"}`}>Conferred: {edu.gradDate} | {edu.location}</p>
                </div>
              ));

            const renderProjectCards = () =>
              data.projects!.map((proj) => (
                <div
                  key={proj.id}
                  className={`${projectCardClass} flex-1 flex flex-col justify-start ${marginalia ? "" : "min-h-[5.5rem]"}`}
                >
                  {marginalia ? (
                    <>
                      <div className={ruledLine}>
                        <span className="font-bold text-slate-900 text-sm">{proj.name}</span>
                      </div>
                      {proj.url ? (
                        <div className={`text-[10px] ${tc.accentText} font-mono break-all ${ruledLine}`}>{proj.url}</div>
                      ) : null}
                    </>
                  ) : (
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{proj.name}</span>
                      {proj.url && <span className={`text-[10px] ${tc.accentText} font-mono break-all max-w-[120px] text-right underline shrink-0`}>{proj.url}</span>}
                    </div>
                  )}
                  <p className={`text-[10px] text-slate-500 font-semibold italic ${marginalia ? ruledLine : ""}`}>Stack: {proj.techStack}</p>
                  <p className={`text-xs text-slate-600 ${marginalia ? ruledLine : "leading-normal"}`}>{renderText(proj.description)}</p>
                </div>
              ));

            if (marginalia && hasEdu && hasProj) {
              return (
                <div className="resume-marginalia-dual-col">
                  <div className="resume-marginalia-dual-col-column">
                    <h2 className={h2Modern("shrink-0")}>Education</h2>
                    <div className={`resume-marginalia-dual-col-body ${marginaliaStack}`}>{renderEducationCards()}</div>
                  </div>
                  <div className="resume-marginalia-dual-col-column">
                    <h2 className={h2Modern("font-sans shrink-0")}>Key Artifacts</h2>
                    <div className={`resume-marginalia-dual-col-body ${marginaliaStack}`}>{renderProjectCards()}</div>
                  </div>
                </div>
              );
            }

            return (
              <div className={`grid grid-cols-1 md:grid-cols-2 ${marginalia ? "gap-7 pt-0" : "gap-6 pt-2"} items-stretch`}>
                {hasEdu && (
                  <div className={`flex flex-col h-full ${marginaliaStack}`}>
                    <h2 className={h2Modern("shrink-0")}>Education</h2>
                    <div className={`flex flex-col flex-1 min-h-0 ${marginaliaStack}`}>{renderEducationCards()}</div>
                  </div>
                )}
                {hasProj && (
                  <div className={`flex flex-col h-full ${marginaliaStack}`}>
                    <h2 className={h2Modern("font-sans shrink-0")}>Key Artifacts</h2>
                    <div className={`flex flex-col flex-1 min-h-0 ${marginaliaStack}`}>{renderProjectCards()}</div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Certifications optional section modern */}
          {data.certifications && data.certifications.length > 0 && (
            <div className={marginaliaSubsection}>
              <h2 className={h2Modern()}>Certifications</h2>
              <div className={marginaliaChipRow}>
                {data.certifications.map((cert, idx) => (
                  <span key={idx} className={marginalia ? marginaliaChipMint : `${tc.skillChip} ${marginaliaChipMint}`}>
                    {renderText(cert)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Volunteer Work optional section modern */}
          {data.volunteerWork && data.volunteerWork.length > 0 && (
            <div className={marginaliaSubsection}>
              <h2 className={h2Modern()}>Volunteer & Community</h2>
              <div className={`grid grid-cols-1 md:grid-cols-2 ${marginaliaStack}`}>
                {data.volunteerWork.map((vol, idx) => (
                  <div
                    key={idx}
                    className={
                      marginalia
                        ? `${educationCardClass} resume-marginalia-card-min-1 text-xs text-[#1a2438] ${ruledLine}`
                        : "bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-700"
                    }
                  >
                    {renderText(vol)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages optional section modern */}
          {data.languages && data.languages.length > 0 && (
            <div className={marginaliaSubsection}>
              <h2 className={h2Modern()}>Languages</h2>
              <div className={marginaliaChipRow}>
                {data.languages.map((lang, idx) => (
                  <span key={idx} className={marginalia ? marginaliaChipMarker : `${tc.langChip} ${marginaliaChipMarker}`}>
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <div className={marginaliaSubsection}>
              <h2 className={h2Modern()}>Skills & Technology Stack</h2>
              {marginalia ? (
                <div className={`${educationCardClass} resume-marginalia-skills-panel`}>
                  <div className={marginaliaChipRow}>
                    {data.skills.map((skill, idx) => (
                      <span key={idx} className={marginaliaChipMint}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={marginaliaChipRow}>
                  {data.skills.map((skill, idx) => (
                    <span key={idx} className={`${tc.skillChip} ${marginaliaChipMint}`}>
                      {skill}
                    </span>
                  ))}
                </div>
              )}
              {renderMissingSkillsBlock()}
            </div>
          )}

        </div>
      </ResumeThemeRoot>
    );
  }

  // Render Minimalist Style (Two-column layout, left side dark sidebar, elegant headers)
  return (
    <ResumeThemeRoot resolved={resolved} className={sheetShellClass}>
      <div className={`grid grid-cols-1 gap-4 ${isEmbedded ? "" : "md:grid-cols-12 md:gap-8"}`}>
        
        {/* Left column: Sidebar info / Skills */}
        <div className={`space-y-4 resume-theme-prose ${isEmbedded ? "" : "md:col-span-4 md:border-r md:border-slate-100 md:pr-6"}`} id="cv-sidebar mb-1 flex flex-col pt-1">
          <div>
            <h1 className={`text-2xl font-bold text-slate-900 leading-tight ${nameClass}`}>
              {data.personalInfo.name}
            </h1>
            <p className={`text-xs font-bold uppercase tracking-widest ${tc.accentText} mt-1.5`}>
              {data.personalInfo.title}
            </p>
          </div>

          <div className="space-y-3 text-slate-600 text-xs pt-4 border-t border-slate-100">
            {data.personalInfo.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span className="break-all">{data.personalInfo.email}</span></div>}
            {data.personalInfo.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span>{data.personalInfo.phone}</span></div>}
            {data.personalInfo.location && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span>{data.personalInfo.location}</span></div>}
            {data.personalInfo.website && <div className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span className="break-all">{data.personalInfo.website}</span></div>}
            {data.personalInfo.linkedin && <div className="flex items-center gap-2"><Linkedin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span className="break-all">{data.personalInfo.linkedin}</span></div>}
            {getHkPersonalMetaLines(data.personalInfo).map((line) => (
              <div key={line} className="text-[10px] text-slate-500">{line}</div>
            ))}
          </div>

          {/* Skills Checklist sidebar */}
          {data.skills && data.skills.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <h3 className={`text-xs font-bold uppercase tracking-wider ${tc.sidebarTitle}`}>Core Expertise</h3>
              <div className="flex flex-col gap-1.5">
                {data.skills.map((skill, index) => (
                  <div key={index} className="text-xs text-slate-700 font-sans flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 ${tc.sidebarDot} rounded-full shrink-0`}></span>
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
              {renderMissingSkillsBlock()}
            </div>
          )}

          {/* Education sidebar */}
          {data.education && data.education.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Credentials</h3>
              {data.education.map((edu) => (
                <div key={edu.id} className="text-xs space-y-0.5">
                  <div className="font-bold text-slate-800">{edu.institution}</div>
                  <div className="text-slate-600">{edu.degree}</div>
                  <div className="text-slate-500 font-mono text-[10px]">{edu.gradDate}</div>
                </div>
              ))}
            </div>
          )}

          {/* Certifications sidebar */}
          {data.certifications && data.certifications.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Certifications</h3>
              <div className="flex flex-col gap-1.5">
                {data.certifications.map((cert, index) => (
                  <div key={index} className="text-xs text-slate-700 font-sans flex items-start gap-2">
                    <span className={`w-1.5 h-1.5 ${tc.sidebarDot} rounded-full shrink-0 mt-1.5`}></span>
                    <span>{renderText(cert)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages sidebar */}
          {data.languages && data.languages.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">Languages</h3>
              <div className="flex flex-wrap gap-1.5">
                {data.languages.map((lang, index) => (
                  <span key={index} className="bg-slate-100 text-slate-705 text-[10px] px-2 py-0.5 rounded border border-slate-200 font-medium">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Experience & projects */}
        <div className={`${isEmbedded ? "" : "md:col-span-8"} ${sectionStackClass}`}>
          {/* Summary */}
          {displaySummary && (
            <div className="space-y-2">
              <h2 className={h2Modern()}>Summary Outline</h2>
              <p className={`text-xs md:text-sm text-slate-700 leading-relaxed font-sans ${highlightChanges && tailoredSummary ? "bg-amber-50 p-3 rounded-lg border-l-4 border-amber-500 text-slate-900" : ""}`}>
                {renderText(displaySummary)}
              </p>
            </div>
          )}

          {/* Experience */}
          {data.experience && data.experience.length > 0 && (
            <div className="space-y-4">
              <h2 className={h2Modern()}>Corporate Experience</h2>
              <div className="space-y-4">
                {data.experience.map((exp) => {
                  const bullets = getDisplayBullets(exp.id, exp.bullets);
                  const isOptimized = isTailoredBullet(exp.id);
                  return (
                    <div key={exp.id} className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-slate-950 text-sm md:text-base">{exp.role}</span>
                        <span className="text-[10px] font-mono font-medium text-slate-400">{exp.startDate} - {exp.endDate}</span>
                      </div>
                      <div className={`text-xs font-semibold ${tc.roleAccent} uppercase tracking-wide`}>{exp.company} — <span className="text-slate-400 font-normal lowercase italic">{exp.location}</span></div>
                      
                      <ul className={`list-disc pl-4 space-y-1.5 text-xs text-slate-700 mt-2 ${isOptimized ? `${tc.expHighlightBg} p-3 border-l-4 ${tc.expHighlightBorder} rounded-r text-slate-900` : ""}`}>
                        {bullets.map((b, i) => (
                           <li key={i} className="leading-relaxed">{renderText(b)}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Volunteer stream */}
          {data.volunteerWork && data.volunteerWork.length > 0 && (
            <div className="space-y-4 pt-2">
              <h2 className={h2Modern("font-sans")}>Volunteer & Outreach</h2>
              <div className="space-y-2">
                {data.volunteerWork.map((vol, index) => (
                  <div key={index} className="text-xs text-slate-705 flex items-start gap-2 bg-slate-50/50 p-2.5 rounded border border-slate-100">
                    <span className={`w-1.5 h-1.5 ${tc.sidebarDot} rounded-full mt-1.5 shrink-0`}></span>
                    <span>{renderText(vol)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {data.projects && data.projects.length > 0 && (
            <div className="space-y-4 pt-2">
              <h2 className={h2Modern()}>Portfolio & Github Repos</h2>
              <div className="space-y-3">
                {data.projects.map((proj) => (
                  <div key={proj.id} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center font-bold text-slate-900">
                      <span>{proj.name}</span>
                      {proj.url && <span className="text-[10px] text-slate-400 font-mono font-normal">{proj.url}</span>}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">Tech Stack: {proj.techStack}</div>
                    <p className="text-slate-650 leading-normal">{renderText(proj.description)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </ResumeThemeRoot>
  );
}

export default memo(ResumeTemplateRenderer);
