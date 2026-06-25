import { memo, useMemo } from "react";
import { Mail, Phone, Globe, MapPin, Linkedin } from "lucide-react";
import type { ResolvedResumeTheme } from "../../lib/resumeThemeCustomization";
import { getHkPersonalMetaLines } from "../../lib/resumeHkMeta";
import type { ResumeDocumentContentProps } from "./resumeDocumentTypes";
import {
  createResumeTextRenderer,
  getDisplayBullets,
  isTailoredBullet,
  MissingSkillsGapBlock,
} from "./resumeDocumentUtils";

export interface ResumeMarginaliaDocumentProps extends ResumeDocumentContentProps {
  resolved: ResolvedResumeTheme;
}

function ResumeMarginaliaDocument({
  data,
  highlightChanges,
  tailoredSummary,
  tailoredBullets,
  matchedKeywords = [],
  missingKeywords = [],
  highlightMatcherActive = false,
  resolved,
}: ResumeMarginaliaDocumentProps) {
  const tc = resolved.classes;
  const cssVarKeys = resolved.cssVars as Record<string, string>;
  const hasCssVar = (key: string) => key in cssVarKeys;

  const nameClass = useMemo(
    () =>
      [
        hasCssVar("--resume-name-size") || hasCssVar("--resume-heading-font") || hasCssVar("--resume-heading-color")
          ? "resume-theme-name"
          : "",
        tc.nameClass,
      ]
        .filter(Boolean)
        .join(" "),
    [cssVarKeys, tc.nameClass],
  );

  const sectionHeadingClass = tc.sectionHeading;
  const h2Modern = (extra = "") =>
    `text-xs font-bold uppercase tracking-wider ${sectionHeadingClass} resume-marginalia-h2 ${extra}`.trim();

  const educationCardClass = [
    hasCssVar("--resume-card-bg") || hasCssVar("--resume-border-color")
      ? "resume-theme-card"
      : "resume-marginalia-card resume-marginalia-card--mint",
    "resume-marginalia-card-ruled",
    hasCssVar("--resume-card-radius") ? "" : "rounded-lg",
  ]
    .filter(Boolean)
    .join(" ");

  const projectCardClass = [
    hasCssVar("--resume-card-bg") || hasCssVar("--resume-border-color")
      ? "resume-theme-card"
      : "resume-marginalia-card resume-marginalia-card--marker",
    "resume-marginalia-card-ruled",
    hasCssVar("--resume-card-radius") ? "" : "rounded-lg",
  ]
    .filter(Boolean)
    .join(" ");

  const marginaliaStack = "resume-marginalia-stack";
  const marginaliaSubsection = "resume-marginalia-subsection";
  const marginaliaChipMint = "resume-marginalia-chip resume-marginalia-chip--mint";
  const marginaliaChipMarker = "resume-marginalia-chip resume-marginalia-chip--marker";
  const marginaliaChipRow = "resume-marginalia-chip-row";
  const ruledLine = "resume-marginalia-ruled-line";

  const renderText = createResumeTextRenderer(matchedKeywords, highlightMatcherActive, true);
  const displaySummary = highlightChanges && tailoredSummary ? tailoredSummary : data.summary;

  return (
    <>
      <div className="resume-marginalia-header resume-marginalia-header-row">
        <div className="resume-marginalia-header-identity">
          <h1 className={`text-3xl md:text-4xl font-bold resume-marginalia-name ${nameClass}`}>
            {data.personalInfo.name}
          </h1>
          <p className={`text-sm font-semibold ${tc.accentText} uppercase tracking-wider ${ruledLine}`}>
            {data.personalInfo.title}
          </p>
        </div>
        <div className="resume-marginalia-header-contact">
          {data.personalInfo.email && (
            <div className="resume-marginalia-contact-row md:justify-end">
              <Mail className={`w-3.5 h-3.5 shrink-0 ${tc.accentText}`} /> {data.personalInfo.email}
            </div>
          )}
          {data.personalInfo.phone && (
            <div className="resume-marginalia-contact-row md:justify-end">
              <Phone className={`w-3.5 h-3.5 shrink-0 ${tc.accentText}`} /> {data.personalInfo.phone}
            </div>
          )}
          {data.personalInfo.location && (
            <div className="resume-marginalia-contact-row md:justify-end">
              <MapPin className={`w-3.5 h-3.5 shrink-0 ${tc.accentText}`} /> {data.personalInfo.location}
            </div>
          )}
          {data.personalInfo.website && (
            <div className="resume-marginalia-contact-row md:justify-end">
              <Globe className={`w-3.5 h-3.5 shrink-0 ${tc.accentText}`} /> {data.personalInfo.website}
            </div>
          )}
          {data.personalInfo.linkedin && (
            <div className="resume-marginalia-contact-row md:justify-end">
              <Linkedin className={`w-3.5 h-3.5 shrink-0 ${tc.accentText}`} /> {data.personalInfo.linkedin}
            </div>
          )}
          {getHkPersonalMetaLines(data.personalInfo).map((line) => (
            <div key={line} className={`text-[10px] resume-marginalia-contact-row md:justify-end`}>
              {line}
            </div>
          ))}
        </div>
      </div>

      <div className="resume-marginalia-section-stack resume-theme-prose">
        {displaySummary && (
          <div className="space-y-0">
            <h2 className={h2Modern("flex items-center gap-2")}>
              Professional Profile
              {highlightChanges && tailoredSummary && (
                <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-mono font-normal">
                  AI Tailored
                </span>
              )}
            </h2>
            <p
              className={`text-sm ${ruledLine} font-serif text-[#1a2438] ${
                highlightChanges && tailoredSummary
                  ? `${tc.tailoredBg} p-3 rounded-lg border-l-4 ${tc.tailoredBorder}`
                  : ""
              }`}
            >
              {renderText(displaySummary)}
            </p>
          </div>
        )}

        {data.experience && data.experience.length > 0 && (
          <div className="flex flex-col resume-marginalia-stack">
            <h2 className={h2Modern()}>Employment Experience</h2>
            <div className="flex flex-col resume-marginalia-stack">
              {data.experience.map((exp) => {
                const bullets = getDisplayBullets(exp.id, exp.bullets, highlightChanges, tailoredBullets);
                const isOptimized = isTailoredBullet(exp.id, highlightChanges, tailoredBullets);
                return (
                  <div key={exp.id} className="relative pl-0">
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
                      <ul
                        className={`text-xs text-slate-600 resume-marginalia-list ${
                          isOptimized
                            ? `${tc.expHighlightBg} p-3.5 border-l-4 ${tc.expHighlightBorder} rounded-r-lg text-slate-800`
                            : ""
                        }`}
                      >
                        {bullets.map((b, i) => (
                          <li key={i} className={ruledLine}>
                            {renderText(b)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(() => {
          const hasEdu = !!(data.education && data.education.length > 0);
          const hasProj = !!(data.projects && data.projects.length > 0);
          if (!hasEdu && !hasProj) return null;

          const renderEducationCards = () =>
            data.education!.map((edu) => (
              <div key={edu.id} className={`${educationCardClass} flex-1 flex flex-col justify-start`}>
                <h4 className={`font-bold text-slate-900 text-sm ${ruledLine}`}>{edu.institution}</h4>
                <p className={`text-xs text-slate-700 font-semibold ${ruledLine}`}>
                  {edu.degree} in {edu.field}
                </p>
                <p className={`text-[10px] text-slate-400 font-mono ${ruledLine}`}>
                  Conferred: {edu.gradDate} | {edu.location}
                </p>
              </div>
            ));

          const renderProjectCards = () =>
            data.projects!.map((proj) => (
              <div key={proj.id} className={`${projectCardClass} flex-1 flex flex-col justify-start`}>
                <div className={ruledLine}>
                  <span className="font-bold text-slate-900 text-sm">{proj.name}</span>
                </div>
                {proj.url ? (
                  <div className={`text-[10px] ${tc.accentText} font-mono break-all ${ruledLine}`}>{proj.url}</div>
                ) : null}
                <p className={`text-[10px] text-slate-500 font-semibold italic ${ruledLine}`}>
                  Stack: {proj.techStack}
                </p>
                <p className={`text-xs text-slate-600 ${ruledLine}`}>{renderText(proj.description)}</p>
              </div>
            ));

          if (hasEdu && hasProj) {
            return (
              <div className="resume-marginalia-dual-col">
                <div className="resume-marginalia-dual-col-column">
                  <h2 className={h2Modern("shrink-0")}>Education</h2>
                  <div className={`resume-marginalia-dual-col-body ${marginaliaStack}`}>{renderEducationCards()}</div>
                </div>
                <div className="resume-marginalia-dual-col-column">
                  <h2 className={h2Modern("shrink-0")}>Key Artifacts</h2>
                  <div className={`resume-marginalia-dual-col-body ${marginaliaStack}`}>{renderProjectCards()}</div>
                </div>
              </div>
            );
          }

          return (
            <div className={`grid grid-cols-1 md:grid-cols-2 ${marginaliaStack}`}>
              {hasEdu && (
                <div className={`flex flex-col h-full ${marginaliaStack}`}>
                  <h2 className={h2Modern("shrink-0")}>Education</h2>
                  <div className={`flex flex-col flex-1 min-h-0 ${marginaliaStack}`}>{renderEducationCards()}</div>
                </div>
              )}
              {hasProj && (
                <div className={`flex flex-col h-full ${marginaliaStack}`}>
                  <h2 className={h2Modern("shrink-0")}>Key Artifacts</h2>
                  <div className={`flex flex-col flex-1 min-h-0 ${marginaliaStack}`}>{renderProjectCards()}</div>
                </div>
              )}
            </div>
          );
        })()}

        {data.certifications && data.certifications.length > 0 && (
          <div className={marginaliaSubsection}>
            <h2 className={h2Modern()}>Certifications</h2>
            <div className={marginaliaChipRow}>
              {data.certifications.map((cert, idx) => (
                <span key={idx} className={marginaliaChipMint}>
                  {renderText(cert)}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.volunteerWork && data.volunteerWork.length > 0 && (
          <div className={marginaliaSubsection}>
            <h2 className={h2Modern()}>Volunteer & Community</h2>
            <div className={`grid grid-cols-1 md:grid-cols-2 ${marginaliaStack}`}>
              {data.volunteerWork.map((vol, idx) => (
                <div
                  key={idx}
                  className={`${educationCardClass} resume-marginalia-card-min-1 text-xs text-[#1a2438] ${ruledLine}`}
                >
                  {renderText(vol)}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.languages && data.languages.length > 0 && (
          <div className={marginaliaSubsection}>
            <h2 className={h2Modern()}>Languages</h2>
            <div className={marginaliaChipRow}>
              {data.languages.map((lang, idx) => (
                <span key={idx} className={marginaliaChipMarker}>
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.skills && data.skills.length > 0 && (
          <div className={marginaliaSubsection}>
            <h2 className={h2Modern()}>Skills & Technology Stack</h2>
            <div className={`${educationCardClass} resume-marginalia-skills-panel`}>
              <div className={marginaliaChipRow}>
                {data.skills.map((skill, idx) => (
                  <span key={idx} className={marginaliaChipMint}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <MissingSkillsGapBlock
              missingKeywords={missingKeywords}
              highlightMatcherActive={highlightMatcherActive}
            />
          </div>
        )}
      </div>
    </>
  );
}

export default memo(ResumeMarginaliaDocument);
