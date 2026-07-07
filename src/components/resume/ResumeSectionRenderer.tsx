/**
 * Unified section markup for flow + free-layout studio.
 * Marginalia flow layout still uses ResumeTemplateRenderer (notebook-specific structure).
 */
import { memo, type ReactNode } from "react";
import { Mail, Phone, MapPin, Globe, Linkedin, AlertCircle } from "lucide-react";
import { ResumeData, AnalysisResult, TemplateStyle } from "../../types";
import { getTemplateFamily } from "../../lib/resumeTemplateCatalog";
import { getSectionLabel } from "../../lib/sectionLabels";
import { getHkPersonalMetaLines } from "../../lib/resumeHkMeta";
import { renderFormattedResumeText } from "../../lib/resumeTextFormatting";
import { useI18n } from "../../i18n";
import { t as translate } from "../../i18n/translate";
import {
  DEFAULT_THEME_CUSTOMIZATION,
  ResolvedResumeTheme,
  resolveResumeTheme,
} from "../../lib/resumeThemeCustomization";
import type { ResumeSectionId } from "../../lib/layoutDocument/sectionRegistry";
import { isCanvasElementId } from "../../lib/canvasElements";
import CanvasElementContent from "./CanvasElementContent";
import type { ResumeFlowVariant } from "./resumeDocumentTypes";
import type { SectionContentSlice } from "../../lib/layoutEntryPagination";

export type ResumeSectionRenderMode = "block" | "flow";

export interface ResumeSectionRendererProps {
  sectionId: ResumeSectionId | string;
  data: ResumeData;
  highlightChanges: boolean;
  analysisResult: AnalysisResult | null;
  templateStyle: TemplateStyle;
  resolvedTheme?: ResolvedResumeTheme;
  /** block = absolute studio card; flow = stacked A4 sections */
  mode?: ResumeSectionRenderMode;
  tailoredSummary?: string;
  tailoredBullets?: { experienceId: string; optimizedBullets: string[] }[];
  matchedKeywords?: string[];
  missingKeywords?: string[];
  highlightMatcherActive?: boolean;
  /** Flow layout variant — minimalist main column uses alternate section rhythm */
  flowVariant?: ResumeFlowVariant;
  /** Print fragment slice — renders a subset of section entries across pages */
  contentSlice?: SectionContentSlice;
}

function SectionHeading({
  title,
  accentText,
  sectionTitle,
}: {
  title: string;
  accentText: string;
  sectionTitle: string;
}) {
  return (
    <h2
      className={`text-xs font-bold uppercase tracking-wider font-sans pb-0.5 mb-1.5 ${accentText} ${sectionTitle}`}
    >
      {title}
    </h2>
  );
}

function ResumeSectionRenderer({
  sectionId,
  data,
  highlightChanges,
  analysisResult,
  templateStyle,
  resolvedTheme,
  mode = "block",
  tailoredSummary,
  tailoredBullets,
  matchedKeywords = [],
  missingKeywords = [],
  highlightMatcherActive = false,
  flowVariant = "standard",
  contentSlice,
}: ResumeSectionRendererProps) {
  const { t, locale } = useI18n();
  const family = getTemplateFamily(templateStyle);
  const resolved = resolvedTheme ?? resolveResumeTheme(templateStyle, DEFAULT_THEME_CUSTOMIZATION);
  const tc = resolved.classes;
  const nameClass = `${resolved.active ? "resume-theme-name" : ""} ${tc.nameClass}`.trim();
  const flowBlockClass = mode === "flow" ? "resume-a4-block" : "";
  const isFlow = mode === "flow";

  const displaySummary =
    highlightChanges && (tailoredSummary ?? analysisResult?.tailoredSummary)
      ? (tailoredSummary ?? analysisResult?.tailoredSummary ?? data.summary)
      : data.summary;

  const renderText = (text: string | undefined) =>
    renderFormattedResumeText(text, matchedKeywords, highlightMatcherActive, false);

  const getDisplayBullets = (expId: string, originalBullets: string[]) => {
    if (highlightChanges && tailoredBullets) {
      const match = tailoredBullets.find((tb) => tb.experienceId === expId);
      if (match?.optimizedBullets?.length) return match.optimizedBullets;
    }
    if (highlightChanges && analysisResult?.tailoredBulletPoints) {
      const match = analysisResult.tailoredBulletPoints.find((tb) => tb.experienceId === expId);
      if (match?.optimizedBullets?.length) return match.optimizedBullets;
    }
    return originalBullets;
  };

  const isTailoredBullet = (expId: string) => {
    if (!highlightChanges) return false;
    if (tailoredBullets?.some((tb) => tb.experienceId === expId)) return true;
    return analysisResult?.tailoredBulletPoints?.some((tb) => tb.experienceId === expId) ?? false;
  };

  const wrap = (content: ReactNode) => {
    if (!isFlow || sectionId === "header") return content;
    return <div className="resume-a4-section">{content}</div>;
  };

  const missingSkillsBlock =
    highlightMatcherActive && missingKeywords.length > 0 ? (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 my-2 text-left no-print font-sans shadow-sm" id="skills-match-gap-box">
        <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>⚠️ {translate("resumeLivePreview.matchGapsTitle")}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {missingKeywords.map((w) => (
            <span key={w} className="bg-rose-100/90 text-rose-800 text-[9px] font-bold px-2 py-0.5 rounded border border-rose-200/85">
              {w}
            </span>
          ))}
        </div>
      </div>
    ) : null;

  switch (sectionId) {
    case "header":
      if (family === "classic") {
        const classicHeader = (
          <div
            className={
              isFlow
                ? `resume-a4-header--classic ${tc.headerBorder} ${tc.sheetFont}`
                : `text-center space-y-1.5 border-b ${tc.headerBorder} pb-3 ${tc.sheetFont}`
            }
          >
            <h1 className={`${isFlow ? "" : "text-2xl"} font-bold text-slate-900 ${nameClass}`}>
              {data.personalInfo.name}
            </h1>
            <p className="text-xs italic text-slate-600">{data.personalInfo.title}</p>
            <div
              className={
                isFlow
                  ? "resume-a4-contact-row text-slate-500 font-sans"
                  : "flex flex-wrap justify-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500"
              }
            >
              {data.personalInfo.email && (
                <span className={isFlow ? "flex items-center gap-1" : undefined}>
                  {isFlow ? <Mail className="w-3 h-3" /> : null} {data.personalInfo.email}
                </span>
              )}
              {data.personalInfo.phone && (
                <span className={isFlow ? "flex items-center gap-1" : undefined}>
                  {isFlow ? <Phone className="w-3 h-3" /> : null} {data.personalInfo.phone}
                </span>
              )}
              {data.personalInfo.location && (
                <span className={isFlow ? "flex items-center gap-1" : undefined}>
                  {isFlow ? <MapPin className="w-3 h-3" /> : null} {data.personalInfo.location}
                </span>
              )}
              {data.personalInfo.website && (
                <span className={isFlow ? "flex items-center gap-1" : undefined}>
                  {isFlow ? <Globe className="w-3 h-3" /> : null} {data.personalInfo.website}
                </span>
              )}
              {data.personalInfo.linkedin && (
                <span className={isFlow ? "flex items-center gap-1" : undefined}>
                  {isFlow ? <Linkedin className="w-3 h-3" /> : null} {data.personalInfo.linkedin}
                </span>
              )}
              {getHkPersonalMetaLines(data.personalInfo).map((line) => (
                <span key={line} className="text-[10px] opacity-90">
                  {line}
                </span>
              ))}
            </div>
          </div>
        );
        return wrap(classicHeader);
      }

      const modernHeader = (
        <div
          className={
            isFlow
              ? `resume-a4-header--modern ${tc.sheetFont}`
              : `space-y-2 ${tc.sheetFont}`
          }
        >
          <div>
            <h1
              className={`${
                isFlow ? "font-extrabold tracking-tight text-slate-900" : "text-2xl font-extrabold tracking-tight text-slate-900"
              } ${nameClass}`}
            >
              {data.personalInfo.name}
            </h1>
            <p className={`text-sm font-semibold ${tc.accentText} uppercase tracking-wider`}>
              {data.personalInfo.title}
            </p>
          </div>
          <div className={isFlow ? "resume-a4-header-contact text-slate-500 shrink-0" : "space-y-0.5 text-[11px] text-slate-500"}>
            {data.personalInfo.email && (
              <div className={`flex items-center gap-1.5 ${isFlow ? "md:justify-end" : ""}`}>
                <Mail className={`w-3 h-3 ${tc.accentText}`} />
                {data.personalInfo.email}
              </div>
            )}
            {data.personalInfo.phone && (
              <div className={`flex items-center gap-1.5 ${isFlow ? "md:justify-end" : ""}`}>
                <Phone className={`w-3 h-3 ${tc.accentText}`} />
                {data.personalInfo.phone}
              </div>
            )}
            {data.personalInfo.location && (
              <div className={`flex items-center gap-1.5 ${isFlow ? "md:justify-end" : ""}`}>
                <MapPin className={`w-3 h-3 ${tc.accentText}`} />
                {data.personalInfo.location}
              </div>
            )}
            {data.personalInfo.website && (
              <div className={`flex items-center gap-1.5 ${isFlow ? "md:justify-end" : ""}`}>
                <Globe className={`w-3 h-3 ${tc.accentText}`} />
                {data.personalInfo.website}
              </div>
            )}
            {data.personalInfo.linkedin && (
              <div className={`flex items-center gap-1.5 ${isFlow ? "md:justify-end" : ""}`}>
                <Linkedin className={`w-3 h-3 ${tc.accentText}`} />
                {data.personalInfo.linkedin}
              </div>
            )}
            {getHkPersonalMetaLines(data.personalInfo).map((line) => (
              <div key={line} className={`text-[10px] opacity-90 ${isFlow ? "md:text-right" : ""}`}>
                {line}
              </div>
            ))}
          </div>
        </div>
      );
      return wrap(modernHeader);

    case "summary":
      return wrap(
        <div className={`space-y-1.5 ${tc.sheetFont}`}>
          <SectionHeading title={getSectionLabel("summary", locale)} accentText={tc.accentText} sectionTitle={tc.sectionTitle} />
          <p
            className={`text-xs leading-relaxed text-slate-700 ${
              highlightChanges && (tailoredSummary ?? analysisResult?.tailoredSummary)
                ? `${tc.tailoredBg} p-2 rounded-lg border-l-4 ${tc.tailoredBorder} text-slate-900`
                : ""
            }`}
          >
            {isFlow ? renderText(displaySummary) : displaySummary}
          </p>
        </div>,
      );

    case "experience": {
      const experienceSlices = contentSlice?.experience;
      const experienceEntries = experienceSlices
        ? experienceSlices
            .map((slice) => {
              const exp = data.experience.find((e) => e.id === slice.entryId);
              if (!exp) return null;
              const allBullets = getDisplayBullets(exp.id, exp.bullets);
              return {
                exp,
                bullets: allBullets.slice(slice.bulletStart, slice.bulletEnd),
                showHeader: slice.showEntryHeader,
              };
            })
            .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
        : data.experience.map((exp) => ({
            exp,
            bullets: getDisplayBullets(exp.id, exp.bullets),
            showHeader: true,
          }));
      const showExperienceHeading = contentSlice ? contentSlice.showHeading : true;
      const continuedLabel = contentSlice?.continued ? ` (${t("canvas.entrySplit.continued")})` : "";

      if (isFlow && flowVariant === "minimalist") {
        return wrap(
          <div className={`space-y-3 ${tc.sheetFont}`}>
            {showExperienceHeading ? (
              <SectionHeading
                title={`${getSectionLabel("experience", locale)}${continuedLabel}`}
                accentText={tc.accentText}
                sectionTitle={tc.sectionTitle}
              />
            ) : null}
            <div className={flowBlockClass}>
              {experienceEntries.map(({ exp, bullets, showHeader }) => {
                const isOptimized = isTailoredBullet(exp.id);
                if (!showHeader && bullets.length === 0) return null;
                return (
                  <div key={`${exp.id}-${bullets.length}-${showHeader ? "h" : "c"}`} className="space-y-1">
                    {showHeader ? (
                      <>
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-slate-950 text-sm">{exp.role}</span>
                          <span className="text-[10px] font-mono font-medium text-slate-400">
                            {exp.startDate} - {exp.endDate}
                          </span>
                        </div>
                        <div className={`text-xs font-semibold ${tc.roleAccent} uppercase tracking-wide`}>
                          {exp.company} —{" "}
                          <span className="text-slate-400 font-normal lowercase italic">{exp.location}</span>
                        </div>
                      </>
                    ) : null}
                    {bullets.length > 0 ? (
                      <ul
                        className={`list-disc pl-4 space-y-1.5 text-xs text-slate-700 mt-2 ${
                          isOptimized ? `${tc.expHighlightBg} p-3 border-l-4 ${tc.expHighlightBorder} rounded-r text-slate-900` : ""
                        }`}
                      >
                        {bullets.map((bullet, i) => (
                          <li key={i} className="leading-relaxed">
                            {renderText(bullet)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>,
        );
      }
      return wrap(
        <div className={`space-y-3 ${tc.sheetFont}`}>
          {showExperienceHeading ? (
            <SectionHeading
              title={`${getSectionLabel("experience", locale)}${continuedLabel}`}
              accentText={tc.accentText}
              sectionTitle={tc.sectionTitle}
            />
          ) : null}
          {experienceEntries.map(({ exp, bullets, showHeader }) => {
            const isOptimized = isTailoredBullet(exp.id);
            if (!showHeader && bullets.length === 0) return null;
            return (
            <div key={`${exp.id}-${bullets.length}-${showHeader ? "h" : "c"}`} className={`space-y-1 ${flowBlockClass} ${isFlow ? "resume-a4-exp-item" : ""}`}>
              {showHeader ? (
                <>
                  <div className="flex justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-900">
                      {family === "classic" ? (
                        exp.company
                      ) : (
                        <>
                          {exp.role} <span className="text-slate-400 font-normal">{t("resumeLivePreview.atCompany")}</span>{" "}
                          <span className={`${tc.accentText} font-bold`}>{exp.company}</span>
                        </>
                      )}
                    </span>
                    <span className="text-slate-400 shrink-0 font-mono text-[10px]">
                      {exp.startDate} – {exp.endDate}
                    </span>
                  </div>
                  {family === "classic" ? (
                    <div className="text-[11px] italic font-semibold text-slate-700">{exp.role}</div>
                  ) : null}
                </>
              ) : null}
              {bullets.length > 0 ? (
                <ul
                  className={`list-disc pl-4 space-y-1 text-[11px] text-slate-600 ${
                    isOptimized ? `${tc.expHighlightBg} p-2 border-l-4 ${tc.expHighlightBorder} rounded-r` : ""
                  }`}
                >
                  {bullets.map((bullet, i) => (
                    <li key={i} className="leading-relaxed">
                      {isFlow ? renderText(bullet) : bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            );
          })}
        </div>,
      );
    }

    case "education": {
      const educationEntries = contentSlice?.education
        ? contentSlice.education
            .map((slice) => data.education.find((e) => e.id === slice.entryId))
            .filter((edu): edu is NonNullable<typeof edu> => Boolean(edu))
        : data.education;
      const continuedLabel = contentSlice?.continued ? ` (${t("canvas.entrySplit.continued")})` : "";
      return wrap(
        <div className={`space-y-2 ${tc.sheetFont}`}>
          {contentSlice?.showHeading === false ? null : (
            <SectionHeading
              title={`${getSectionLabel("education", locale)}${continuedLabel}`}
              accentText={tc.accentText}
              sectionTitle={tc.sectionTitle}
            />
          )}
          {educationEntries.map((edu) => (
            <div key={edu.id} className={`flex justify-between gap-2 text-xs ${flowBlockClass}`}>
              <div>
                <span className="font-bold text-slate-900">{edu.institution}</span>
                <span className="text-slate-600">
                  {" "}
                  — {edu.degree} in {edu.field}
                </span>
              </div>
              <span className="text-slate-400 shrink-0 text-[10px]">{edu.gradDate}</span>
            </div>
          ))}
        </div>,
      );
    }

    case "projects": {
      const projectEntries = contentSlice?.projects
        ? contentSlice.projects
            .map((slice) => {
              const proj = data.projects.find((p) => p.id === slice.entryId);
              if (!proj) return null;
              return { proj, showHeader: slice.showEntryHeader };
            })
            .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
        : data.projects.map((proj) => ({ proj, showHeader: true }));
      const continuedLabel = contentSlice?.continued ? ` (${t("canvas.entrySplit.continued")})` : "";
      if (isFlow && flowVariant === "minimalist") {
        return wrap(
          <div className={`space-y-2 ${tc.sheetFont}`}>
            {contentSlice?.showHeading === false ? null : (
              <SectionHeading
                title={`${getSectionLabel("projects", locale)}${continuedLabel}`}
                accentText={tc.accentText}
                sectionTitle={tc.sectionTitle}
              />
            )}
            <div className={flowBlockClass}>
              {projectEntries.map(({ proj, showHeader }) => (
                <div key={proj.id} className="space-y-1 text-xs">
                  {showHeader ? (
                    <>
                      <div className="flex justify-between items-center font-bold text-slate-900">
                        <span>{proj.name}</span>
                        {proj.url && (
                          <span className="text-[10px] text-slate-400 font-mono font-normal">{proj.url}</span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">Tech Stack: {proj.techStack}</div>
                    </>
                  ) : null}
                  <p className="text-slate-650 leading-normal">{renderText(proj.description)}</p>
                </div>
              ))}
            </div>
          </div>,
        );
      }
      return wrap(
        <div className={`space-y-2 ${tc.sheetFont}`}>
          {contentSlice?.showHeading === false ? null : (
            <SectionHeading
              title={`${getSectionLabel("projects", locale)}${continuedLabel}`}
              accentText={tc.accentText}
              sectionTitle={tc.sectionTitle}
            />
          )}
          {projectEntries.map(({ proj, showHeader }) => (
            <div key={proj.id} className={`text-xs space-y-0.5 ${flowBlockClass}`}>
              {showHeader ? (
                <>
                  <div className="font-bold text-slate-900">{proj.name}</div>
                  <div className={`text-[10px] ${tc.accentText}`}>{proj.techStack}</div>
                </>
              ) : null}
              <p className="text-slate-600 leading-relaxed">{isFlow ? renderText(proj.description) : proj.description}</p>
            </div>
          ))}
        </div>,
      );
    }

    case "skills":
      if (isFlow && family === "classic") {
        return wrap(
          <div className={`space-y-1.5 ${tc.sheetFont}`}>
            <SectionHeading title={getSectionLabel("skills", locale)} accentText={tc.accentText} sectionTitle={tc.sectionTitle} />
            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              <strong>Skills:</strong> {data.skills.join(", ")}
            </p>
            {missingSkillsBlock}
          </div>,
        );
      }
      return wrap(
        <div className={`space-y-2 ${tc.sheetFont}`}>
          <SectionHeading title={getSectionLabel("skills", locale)} accentText={tc.accentText} sectionTitle={tc.sectionTitle} />
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((skill) => (
              <span
                key={skill}
                className={`text-[10px] px-2 py-0.5 rounded font-medium border ${tc.skillChip}`}
              >
                {skill}
              </span>
            ))}
          </div>
          {missingSkillsBlock}
        </div>,
      );

    case "certifications":
      return wrap(
        <div className={`space-y-1.5 ${tc.sheetFont}`}>
          <SectionHeading title={getSectionLabel("certifications", locale)} accentText={tc.accentText} sectionTitle={tc.sectionTitle} />
          <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-1">
            {data.certifications?.map((cert, i) => (
              <li key={i}>{isFlow ? renderText(cert) : cert}</li>
            ))}
          </ul>
        </div>,
      );

    case "volunteer":
      if (isFlow && flowVariant === "minimalist") {
        return wrap(
          <div className={`space-y-1.5 ${tc.sheetFont}`}>
            <SectionHeading title={getSectionLabel("volunteer", locale)} accentText={tc.accentText} sectionTitle={tc.sectionTitle} />
            <div className="space-y-2">
              {data.volunteerWork?.map((item, i) => (
                <div
                  key={i}
                  className="text-xs text-slate-705 flex items-start gap-2 bg-slate-50/50 p-2.5 rounded border border-slate-100"
                >
                  <span className={`w-1.5 h-1.5 ${tc.sidebarDot} rounded-full mt-1.5 shrink-0`} />
                  <span>{renderText(item)}</span>
                </div>
              ))}
            </div>
          </div>,
        );
      }
      return wrap(
        <div className={`space-y-1.5 ${tc.sheetFont}`}>
          <SectionHeading title={getSectionLabel("volunteer", locale)} accentText={tc.accentText} sectionTitle={tc.sectionTitle} />
          <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-1">
            {data.volunteerWork?.map((item, i) => (
              <li key={i}>{isFlow ? renderText(item) : item}</li>
            ))}
          </ul>
        </div>,
      );

    case "languages":
      return wrap(
        <div className={`space-y-2 ${tc.sheetFont}`}>
          <SectionHeading title={getSectionLabel("languages", locale)} accentText={tc.accentText} sectionTitle={tc.sectionTitle} />
          <div className="flex flex-wrap gap-1.5">
            {data.languages?.map((lang) => (
              <span
                key={lang}
                className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${tc.langChip}`}
              >
                {lang}
              </span>
            ))}
          </div>
        </div>,
      );

    default:
      if (isCanvasElementId(String(sectionId))) {
        return <CanvasElementContent id={String(sectionId)} editable={mode === "block"} />;
      }
      return null;
  }
}

export default memo(ResumeSectionRenderer);
