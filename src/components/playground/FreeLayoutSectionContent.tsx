import React, { memo } from "react";
import { Mail, Phone, MapPin, Globe, Linkedin } from "lucide-react";
import { ResumeData, AnalysisResult, TemplateStyle } from "../../types";
import { getTemplateFamily } from "../../lib/resumeTemplateCatalog";
import { getSectionLabel } from "../../lib/sectionLabels";
import { useI18n } from "../../i18n";
import {
  DEFAULT_THEME_CUSTOMIZATION,
  ResolvedResumeTheme,
  resolveResumeTheme,
} from "../../lib/resumeThemeCustomization";

export interface FreeLayoutSectionContentProps {
  sectionId: string;
  data: ResumeData;
  highlightChanges: boolean;
  analysisResult: AnalysisResult | null;
  templateStyle: TemplateStyle;
  resolvedTheme?: ResolvedResumeTheme;
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

export default memo(FreeLayoutSectionContent);

function FreeLayoutSectionContent({
  sectionId,
  data,
  highlightChanges,
  analysisResult,
  templateStyle,
  resolvedTheme,
}: FreeLayoutSectionContentProps) {
  const { t, locale } = useI18n();
  const family = getTemplateFamily(templateStyle);
  const resolved = resolvedTheme ?? resolveResumeTheme(templateStyle, DEFAULT_THEME_CUSTOMIZATION);
  const tc = resolved.classes;
  const nameClass = `${resolved.active ? "resume-theme-name" : ""} ${tc.nameClass}`.trim();

  const displaySummary =
    highlightChanges && analysisResult?.tailoredSummary
      ? analysisResult.tailoredSummary
      : data.summary;

  switch (sectionId) {
    case "header":
      if (family === "classic") {
        return (
          <div className={`text-center space-y-1.5 border-b ${tc.headerBorder} pb-3 ${tc.sheetFont}`}>
            <h1 className={`text-2xl font-bold text-slate-900 ${nameClass}`}>{data.personalInfo.name}</h1>
            <p className="text-xs italic text-slate-600">{data.personalInfo.title}</p>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
              {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
              {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
              {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
            </div>
          </div>
        );
      }

      return (
        <div className={`space-y-2 ${tc.sheetFont}`}>
          <h1 className={`text-2xl font-extrabold tracking-tight text-slate-900 ${nameClass}`}>
            {data.personalInfo.name}
          </h1>
          <p className={`text-sm font-semibold ${tc.accentText} uppercase tracking-wider`}>
            {data.personalInfo.title}
          </p>
          <div className="space-y-0.5 text-[11px] text-slate-500">
            {data.personalInfo.email && (
              <div className="flex items-center gap-1.5">
                <Mail className={`w-3 h-3 ${tc.accentText}`} />
                {data.personalInfo.email}
              </div>
            )}
            {data.personalInfo.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className={`w-3 h-3 ${tc.accentText}`} />
                {data.personalInfo.phone}
              </div>
            )}
            {data.personalInfo.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className={`w-3 h-3 ${tc.accentText}`} />
                {data.personalInfo.location}
              </div>
            )}
            {data.personalInfo.website && (
              <div className="flex items-center gap-1.5">
                <Globe className={`w-3 h-3 ${tc.accentText}`} />
                {data.personalInfo.website}
              </div>
            )}
            {data.personalInfo.linkedin && (
              <div className="flex items-center gap-1.5">
                <Linkedin className={`w-3 h-3 ${tc.accentText}`} />
                {data.personalInfo.linkedin}
              </div>
            )}
          </div>
        </div>
      );

    case "summary":
      return (
        <div className={`space-y-1.5 ${tc.sheetFont}`}>
          <SectionHeading title={getSectionLabel("summary", locale)} accentText={tc.accentText} sectionTitle={tc.sectionTitle} />
          <p
            className={`text-xs leading-relaxed text-slate-700 ${
              highlightChanges && analysisResult?.tailoredSummary
                ? `${tc.tailoredBg} p-2 rounded-lg border-l-4 ${tc.tailoredBorder} text-slate-900`
                : ""
            }`}
          >
            {displaySummary}
          </p>
        </div>
      );

    case "experience":
      return (
        <div className={`space-y-3 ${tc.sheetFont}`}>
          <SectionHeading title={getSectionLabel("experience", locale)} accentText={tc.accentText} sectionTitle={tc.sectionTitle} />
          {data.experience.map((exp) => (
            <div key={exp.id} className="space-y-1">
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
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                {exp.bullets.map((bullet, i) => (
                  <li key={i} className="leading-relaxed">
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );

    case "education":
      return (
        <div className={`space-y-2 ${tc.sheetFont}`}>
          <SectionHeading title={getSectionLabel("education", locale)} accentText={tc.accentText} sectionTitle={tc.sectionTitle} />
          {data.education.map((edu) => (
            <div key={edu.id} className="flex justify-between gap-2 text-xs">
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
        </div>
      );

    case "projects":
      return (
        <div className={`space-y-2 ${tc.sheetFont}`}>
          <SectionHeading title={getSectionLabel("projects", locale)} accentText={tc.accentText} sectionTitle={tc.sectionTitle} />
          {data.projects.map((proj) => (
            <div key={proj.id} className="text-xs space-y-0.5">
              <div className="font-bold text-slate-900">{proj.name}</div>
              <div className={`text-[10px] ${tc.accentText}`}>{proj.techStack}</div>
              <p className="text-slate-600 leading-relaxed">{proj.description}</p>
            </div>
          ))}
        </div>
      );

    case "skills":
      return (
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
        </div>
      );

    case "certifications":
      return (
        <div className={`space-y-1.5 ${tc.sheetFont}`}>
          <SectionHeading title={getSectionLabel("certifications", locale)} accentText={tc.accentText} sectionTitle={tc.sectionTitle} />
          <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-1">
            {data.certifications?.map((cert, i) => (
              <li key={i}>{cert}</li>
            ))}
          </ul>
        </div>
      );

    case "volunteer":
      return (
        <div className={`space-y-1.5 ${tc.sheetFont}`}>
          <SectionHeading title={getSectionLabel("volunteer", locale)} accentText={tc.accentText} sectionTitle={tc.sectionTitle} />
          <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-1">
            {data.volunteerWork?.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      );

    case "languages":
      return (
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
        </div>
      );

    default:
      return null;
  }
}
