import { memo } from "react";
import { Mail, Phone, MapPin, Globe, Linkedin } from "lucide-react";
import { ResumeData } from "../../types";
import { getHkPersonalMetaLines } from "../../lib/resumeHkMeta";
import { ResolvedResumeTheme, resolveResumeTheme, DEFAULT_THEME_CUSTOMIZATION } from "../../lib/resumeThemeCustomization";
import type { TemplateStyle } from "../../types";
import { createResumeTextRenderer, MissingSkillsGapBlock } from "./resumeDocumentUtils";
import type { ResumeDocumentContentProps } from "./resumeDocumentTypes";

export interface MinimalistA4SidebarProps extends ResumeDocumentContentProps {
  resolvedTheme?: ResolvedResumeTheme;
}

function MinimalistA4Sidebar({
  data,
  templateStyle,
  highlightMatcherActive = false,
  missingKeywords = [],
  matchedKeywords = [],
  resolvedTheme,
}: MinimalistA4SidebarProps) {
  const resolved = resolvedTheme ?? resolveResumeTheme(templateStyle, DEFAULT_THEME_CUSTOMIZATION);
  const tc = resolved.classes;
  const nameClass = `${resolved.active ? "resume-theme-name" : ""} ${tc.nameClass}`.trim();
  const renderText = createResumeTextRenderer(matchedKeywords, highlightMatcherActive);

  return (
    <div className="resume-a4-minimalist-sidebar" id="cv-sidebar">
      <div>
        <h1 className={`font-bold text-slate-900 leading-tight ${nameClass}`}>{data.personalInfo.name}</h1>
        <p className={`text-xs font-bold uppercase tracking-widest ${tc.accentText} mt-1.5`}>{data.personalInfo.title}</p>
      </div>

      <div className="resume-a4-sidebar-block">
        {data.personalInfo.email && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="break-all">{data.personalInfo.email}</span>
          </div>
        )}
        {data.personalInfo.phone && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{data.personalInfo.phone}</span>
          </div>
        )}
        {data.personalInfo.location && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{data.personalInfo.location}</span>
          </div>
        )}
        {data.personalInfo.website && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="break-all">{data.personalInfo.website}</span>
          </div>
        )}
        {data.personalInfo.linkedin && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Linkedin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="break-all">{data.personalInfo.linkedin}</span>
          </div>
        )}
        {getHkPersonalMetaLines(data.personalInfo).map((line) => (
          <div key={line} className="text-[10px] text-slate-500">
            {line}
          </div>
        ))}
      </div>

      {data.skills.length > 0 && (
        <div className="resume-a4-sidebar-block">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${tc.sidebarTitle}`}>Core Expertise</h3>
          <div className="flex flex-col gap-1.5">
            {data.skills.map((skill) => (
              <div key={skill} className="text-xs text-slate-700 font-sans flex items-center gap-2">
                <span className={`w-1.5 h-1.5 ${tc.sidebarDot} rounded-full shrink-0`} />
                <span>{skill}</span>
              </div>
            ))}
          </div>
          <MissingSkillsGapBlock missingKeywords={missingKeywords} highlightMatcherActive={highlightMatcherActive} />
        </div>
      )}

      {data.education.length > 0 && (
        <div className="resume-a4-sidebar-block">
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

      {data.certifications && data.certifications.length > 0 && (
        <div className="resume-a4-sidebar-block">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Certifications</h3>
          <div className="flex flex-col gap-1.5">
            {data.certifications.map((cert, index) => (
              <div key={index} className="text-xs text-slate-700 font-sans flex items-start gap-2">
                <span className={`w-1.5 h-1.5 ${tc.sidebarDot} rounded-full shrink-0 mt-1.5`} />
                <span>{renderText(cert)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.languages && data.languages.length > 0 && (
        <div className="resume-a4-sidebar-block">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">Languages</h3>
          <div className="flex flex-wrap gap-1.5">
            {data.languages.map((lang) => (
              <span
                key={lang}
                className="bg-slate-100 text-slate-705 text-[10px] px-2 py-0.5 rounded border border-slate-200 font-medium"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(MinimalistA4Sidebar);
