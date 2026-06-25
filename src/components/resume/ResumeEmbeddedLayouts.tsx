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

export interface ResumeEmbeddedDocumentProps extends ResumeDocumentContentProps {
  resolved: ResolvedResumeTheme;
}

function useEmbeddedTheme(resolved: ResolvedResumeTheme) {
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

  const sectionBorderClass = tc.sectionBorder;
  const h2Classic = (extra = "") =>
    `text-xs font-bold uppercase tracking-wider ${tc.accentText} font-sans pb-0.5 ${sectionBorderClass} ${extra}`.trim();
  const h2Modern = (extra = "") =>
    `text-xs font-bold uppercase tracking-wider ${tc.sectionHeading} ${sectionBorderClass} ${extra}`.trim();

  return { tc, nameClass, h2Classic, h2Modern };
}

export function ResumeEmbeddedClassic({
  data,
  highlightChanges,
  tailoredSummary,
  tailoredBullets,
  matchedKeywords = [],
  missingKeywords = [],
  highlightMatcherActive = false,
  resolved,
}: ResumeEmbeddedDocumentProps) {
  const { nameClass, h2Classic } = useEmbeddedTheme(resolved);
  const renderText = createResumeTextRenderer(matchedKeywords, highlightMatcherActive, false);
  const displaySummary = highlightChanges && tailoredSummary ? tailoredSummary : data.summary;

  return (
    <>
      <div className={`text-center space-y-2 border-b ${resolved.classes.headerBorder} pb-4 mb-6`}>
        <h1 className={`text-2xl md:text-3xl font-bold text-slate-900 ${nameClass}`}>{data.personalInfo.name}</h1>
        <p className="text-xs md:text-sm font-medium italic text-slate-600">{data.personalInfo.title}</p>
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-sans mt-2">
          {data.personalInfo.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" /> {data.personalInfo.email}
            </span>
          )}
          {data.personalInfo.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> {data.personalInfo.phone}
            </span>
          )}
          {data.personalInfo.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {data.personalInfo.location}
            </span>
          )}
          {data.personalInfo.website && (
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" /> {data.personalInfo.website}
            </span>
          )}
          {data.personalInfo.linkedin && (
            <span className="flex items-center gap-1">
              <Linkedin className="w-3 h-3" /> {data.personalInfo.linkedin}
            </span>
          )}
          {getHkPersonalMetaLines(data.personalInfo).map((line) => (
            <span key={line} className="flex items-center gap-1 text-[10px] opacity-90">
              {line}
            </span>
          ))}
        </div>
      </div>

      {displaySummary && (
        <div className="mb-6 space-y-1.5">
          <h2 className={h2Classic()}>Professional Summary</h2>
          <p
            className={`text-xs md:text-sm leading-relaxed text-slate-705 ${
              highlightChanges && tailoredSummary
                ? "bg-amber-50 border-l-2 border-amber-400 pl-2.5 py-1 text-slate-900 inline-block w-full"
                : ""
            }`}
          >
            {renderText(displaySummary)}
          </p>
        </div>
      )}

      {data.experience && data.experience.length > 0 && (
        <div className="mb-6 space-y-3">
          <h2 className={h2Classic()}>Professional Experience</h2>
          <div className="space-y-4">
            {data.experience.map((exp) => {
              const bullets = getDisplayBullets(exp.id, exp.bullets, highlightChanges, tailoredBullets);
              const isOptimized = isTailoredBullet(exp.id, highlightChanges, tailoredBullets);
              return (
                <div key={exp.id} className="space-y-1">
                  <div className="flex justify-between items-baseline text-xs md:text-sm">
                    <span className="font-bold text-slate-900">{exp.company}</span>
                    <span className="text-slate-600 italic font-sans">
                      {exp.startDate} – {exp.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="italic font-semibold text-slate-700">{exp.role}</span>
                    <span className="text-slate-500 font-sans">{exp.location}</span>
                  </div>
                  <ul
                    className={`list-disc list-outside pl-4 text-xs text-slate-700 space-y-1 mt-1.5 ${
                      isOptimized ? "bg-emerald-50/55 pl-6 py-1.5 border-l-2 border-emerald-400 rounded-r" : ""
                    }`}
                  >
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

      {data.education && data.education.length > 0 && (
        <div className="mb-6 space-y-2">
          <h2 className={h2Classic()}>Education</h2>
          <div className="space-y-2">
            {data.education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline text-xs">
                <div>
                  <span className="font-bold text-slate-950">{edu.institution}</span>
                  <span className="text-slate-600">
                    {" "}
                    — {edu.degree} in {edu.field}
                  </span>
                </div>
                <span className="text-slate-500 font-sans shrink-0">{edu.gradDate}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.projects && data.projects.length > 0 && (
        <div className="mb-6 space-y-2">
          <h2 className={h2Classic()}>Key Projects</h2>
          <div className="space-y-3">
            {data.projects.map((proj) => (
              <div key={proj.id} className="space-y-0.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">{proj.name}</span>
                  {proj.url && (
                    <span className="text-slate-500 italic font-sans break-all max-w-[200px] text-right">
                      {proj.url}
                    </span>
                  )}
                </div>
                <p className="text-slate-650 italic">Tech Stack: {proj.techStack}</p>
                <p className="text-slate-700 leading-relaxed">{renderText(proj.description)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.certifications && data.certifications.length > 0 && (
        <div className="mb-6 space-y-1.5">
          <h2 className={h2Classic()}>Certifications & Credentials</h2>
          <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700">
            {data.certifications.map((cert, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderText(cert)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.volunteerWork && data.volunteerWork.length > 0 && (
        <div className="mb-6 space-y-1.5">
          <h2 className={h2Classic()}>Volunteer Work & Service</h2>
          <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700">
            {data.volunteerWork.map((vol, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderText(vol)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.languages && data.languages.length > 0 && (
        <div className="mb-6 space-y-1.5">
          <h2 className={h2Classic()}>Languages</h2>
          <p className="text-xs text-slate-705 leading-relaxed font-sans">{data.languages.join(", ")}</p>
        </div>
      )}

      {data.skills && data.skills.length > 0 && (
        <div className="space-y-1.5">
          <h2 className={h2Classic()}>Technical Credentials</h2>
          <p className="text-xs text-slate-700 leading-relaxed font-sans">
            <strong>Skills:</strong> {data.skills.join(", ")}
          </p>
          <MissingSkillsGapBlock missingKeywords={missingKeywords} highlightMatcherActive={highlightMatcherActive} />
        </div>
      )}
    </>
  );
}

export function ResumeEmbeddedModern({
  data,
  highlightChanges,
  tailoredSummary,
  tailoredBullets,
  matchedKeywords = [],
  missingKeywords = [],
  highlightMatcherActive = false,
  resolved,
}: ResumeEmbeddedDocumentProps) {
  const { tc, nameClass, h2Modern } = useEmbeddedTheme(resolved);
  const renderText = createResumeTextRenderer(matchedKeywords, highlightMatcherActive, false);
  const displaySummary = highlightChanges && tailoredSummary ? tailoredSummary : data.summary;
  const cardClass = [
    resolved.cssVars && "--resume-card-bg" in (resolved.cssVars as Record<string, string>)
      ? "resume-theme-card"
      : "",
    "bg-slate-50 p-3 border border-slate-100",
    "--resume-card-radius" in (resolved.cssVars as Record<string, string>) ? "" : "rounded-lg",
  ]
    .filter(Boolean)
    .join(" ");
  const marginaliaChipMint = "text-xs px-2.5 py-1 rounded font-medium border";
  const marginaliaChipMarker = "text-xs px-2.5 py-1 rounded font-semibold border";
  const marginaliaChipRow = "flex flex-wrap gap-1.5";
  const marginaliaSubsection = "space-y-2 pt-2 border-t border-slate-100";
  const ruledLine = "leading-relaxed";

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight text-slate-900 ${nameClass}`}>
            {data.personalInfo.name}
          </h1>
          <p className={`text-sm font-semibold ${tc.accentText} uppercase tracking-wider mt-1`}>
            {data.personalInfo.title}
          </p>
        </div>
        <div className="space-y-1 text-slate-500 text-xs text-left md:text-right shrink-0">
          {data.personalInfo.email && (
            <div className="flex items-center md:justify-end gap-1.5">
              <Mail className={`w-3.5 h-3.5 shrink-0 ${tc.accentText}`} /> {data.personalInfo.email}
            </div>
          )}
          {data.personalInfo.phone && (
            <div className="flex items-center md:justify-end gap-1.5">
              <Phone className={`w-3.5 h-3.5 shrink-0 ${tc.accentText}`} /> {data.personalInfo.phone}
            </div>
          )}
          {data.personalInfo.location && (
            <div className="flex items-center md:justify-end gap-1.5">
              <MapPin className={`w-3.5 h-3.5 shrink-0 ${tc.accentText}`} /> {data.personalInfo.location}
            </div>
          )}
          {data.personalInfo.website && (
            <div className="flex items-center md:justify-end gap-1.5">
              <Globe className={`w-3.5 h-3.5 shrink-0 ${tc.accentText}`} /> {data.personalInfo.website}
            </div>
          )}
          {data.personalInfo.linkedin && (
            <div className="flex items-center md:justify-end gap-1.5">
              <Linkedin className={`w-3.5 h-3.5 shrink-0 ${tc.accentText}`} /> {data.personalInfo.linkedin}
            </div>
          )}
          {getHkPersonalMetaLines(data.personalInfo).map((line) => (
            <div key={line} className="text-[10px] flex md:justify-end opacity-90">
              {line}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6 resume-theme-prose">
        {displaySummary && (
          <div className="space-y-2">
            <h2 className={h2Modern("flex items-center gap-2")}>
              Professional Profile
              {highlightChanges && tailoredSummary && (
                <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-mono font-normal">
                  AI Tailored
                </span>
              )}
            </h2>
            <p
              className={`text-sm text-slate-700 font-sans leading-relaxed ${ruledLine} ${
                highlightChanges && tailoredSummary
                  ? "bg-amber-50 p-3 rounded-lg border-l-4 border-amber-500 text-slate-900"
                  : ""
              }`}
            >
              {renderText(displaySummary)}
            </p>
          </div>
        )}

        {data.experience && data.experience.length > 0 && (
          <div className="space-y-4">
            <h2 className={h2Modern()}>Employment Experience</h2>
            <div className="space-y-5">
              {data.experience.map((exp) => {
                const bullets = getDisplayBullets(exp.id, exp.bullets, highlightChanges, tailoredBullets);
                const isOptimized = isTailoredBullet(exp.id, highlightChanges, tailoredBullets);
                return (
                  <div key={exp.id} className="relative pl-0">
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
                    <ul
                      className={`text-xs text-slate-600 list-disc pl-5 md:text-sm space-y-1.5 ${
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
              <div key={edu.id} className={`${cardClass} flex-1 flex flex-col justify-start min-h-[5.5rem]`}>
                <h4 className="font-bold text-slate-900 text-sm">{edu.institution}</h4>
                <p className="text-xs text-slate-700 font-semibold">
                  {edu.degree} in {edu.field}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Conferred: {edu.gradDate} | {edu.location}
                </p>
              </div>
            ));

          const renderProjectCards = () =>
            data.projects!.map((proj) => (
              <div key={proj.id} className={`${cardClass} flex-1 flex flex-col justify-start min-h-[5.5rem]`}>
                <div className="flex justify-between items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{proj.name}</span>
                  {proj.url && (
                    <span
                      className={`text-[10px] ${tc.accentText} font-mono break-all max-w-[120px] text-right underline shrink-0`}
                    >
                      {proj.url}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 font-semibold italic">Stack: {proj.techStack}</p>
                <p className="text-xs text-slate-600 leading-normal">{renderText(proj.description)}</p>
              </div>
            ));

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {hasEdu && (
                <div className="flex flex-col h-full gap-3">
                  <h2 className={h2Modern("shrink-0")}>Education</h2>
                  <div className="flex flex-col flex-1 min-h-0 gap-3">{renderEducationCards()}</div>
                </div>
              )}
              {hasProj && (
                <div className="flex flex-col h-full gap-3">
                  <h2 className={h2Modern("shrink-0")}>Key Artifacts</h2>
                  <div className="flex flex-col flex-1 min-h-0 gap-3">{renderProjectCards()}</div>
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
                <span key={idx} className={`${tc.skillChip} ${marginaliaChipMint}`}>
                  {renderText(cert)}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.volunteerWork && data.volunteerWork.length > 0 && (
          <div className={marginaliaSubsection}>
            <h2 className={h2Modern()}>Volunteer & Community</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.volunteerWork.map((vol, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-700"
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
                <span key={idx} className={`${tc.langChip} ${marginaliaChipMarker}`}>
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.skills && data.skills.length > 0 && (
          <div className={marginaliaSubsection}>
            <h2 className={h2Modern()}>Skills & Technology Stack</h2>
            <div className={marginaliaChipRow}>
              {data.skills.map((skill, idx) => (
                <span key={idx} className={`${tc.skillChip} ${marginaliaChipMint}`}>
                  {skill}
                </span>
              ))}
            </div>
            <MissingSkillsGapBlock missingKeywords={missingKeywords} highlightMatcherActive={highlightMatcherActive} />
          </div>
        )}
      </div>
    </>
  );
}

export function ResumeEmbeddedMinimalist({
  data,
  highlightChanges,
  tailoredSummary,
  tailoredBullets,
  matchedKeywords = [],
  missingKeywords = [],
  highlightMatcherActive = false,
  resolved,
}: ResumeEmbeddedDocumentProps) {
  const { tc, nameClass, h2Modern } = useEmbeddedTheme(resolved);
  const renderText = createResumeTextRenderer(matchedKeywords, highlightMatcherActive, false);
  const displaySummary = highlightChanges && tailoredSummary ? tailoredSummary : data.summary;
  const sectionStackClass = "space-y-6 resume-theme-prose";

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="space-y-4 resume-theme-prose" id="cv-sidebar mb-1 flex flex-col pt-1">
        <div>
          <h1 className={`text-2xl font-bold text-slate-900 leading-tight ${nameClass}`}>{data.personalInfo.name}</h1>
          <p className={`text-xs font-bold uppercase tracking-widest ${tc.accentText} mt-1.5`}>
            {data.personalInfo.title}
          </p>
        </div>

        <div className="space-y-3 text-slate-600 text-xs pt-4 border-t border-slate-100">
          {data.personalInfo.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />{" "}
              <span className="break-all">{data.personalInfo.email}</span>
            </div>
          )}
          {data.personalInfo.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span>{data.personalInfo.phone}</span>
            </div>
          )}
          {data.personalInfo.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span>{data.personalInfo.location}</span>
            </div>
          )}
          {data.personalInfo.website && (
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />{" "}
              <span className="break-all">{data.personalInfo.website}</span>
            </div>
          )}
          {data.personalInfo.linkedin && (
            <div className="flex items-center gap-2">
              <Linkedin className="w-3.5 h-3.5 text-slate-400 shrink-0" />{" "}
              <span className="break-all">{data.personalInfo.linkedin}</span>
            </div>
          )}
          {getHkPersonalMetaLines(data.personalInfo).map((line) => (
            <div key={line} className="text-[10px] text-slate-500">
              {line}
            </div>
          ))}
        </div>

        {data.skills && data.skills.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${tc.sidebarTitle}`}>Core Expertise</h3>
            <div className="flex flex-col gap-1.5">
              {data.skills.map((skill, index) => (
                <div key={index} className="text-xs text-slate-700 font-sans flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 ${tc.sidebarDot} rounded-full shrink-0`} />
                  <span>{skill}</span>
                </div>
              ))}
            </div>
            <MissingSkillsGapBlock missingKeywords={missingKeywords} highlightMatcherActive={highlightMatcherActive} />
          </div>
        )}

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

        {data.certifications && data.certifications.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-slate-100">
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
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">Languages</h3>
            <div className="flex flex-wrap gap-1.5">
              {data.languages.map((lang, index) => (
                <span
                  key={index}
                  className="bg-slate-100 text-slate-705 text-[10px] px-2 py-0.5 rounded border border-slate-200 font-medium"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={sectionStackClass}>
        {displaySummary && (
          <div className="space-y-2">
            <h2 className={h2Modern()}>Summary Outline</h2>
            <p
              className={`text-xs md:text-sm text-slate-700 leading-relaxed font-sans ${
                highlightChanges && tailoredSummary
                  ? "bg-amber-50 p-3 rounded-lg border-l-4 border-amber-500 text-slate-900"
                  : ""
              }`}
            >
              {renderText(displaySummary)}
            </p>
          </div>
        )}

        {data.experience && data.experience.length > 0 && (
          <div className="space-y-4">
            <h2 className={h2Modern()}>Corporate Experience</h2>
            <div className="space-y-4">
              {data.experience.map((exp) => {
                const bullets = getDisplayBullets(exp.id, exp.bullets, highlightChanges, tailoredBullets);
                const isOptimized = isTailoredBullet(exp.id, highlightChanges, tailoredBullets);
                return (
                  <div key={exp.id} className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-950 text-sm md:text-base">{exp.role}</span>
                      <span className="text-[10px] font-mono font-medium text-slate-400">
                        {exp.startDate} - {exp.endDate}
                      </span>
                    </div>
                    <div className={`text-xs font-semibold ${tc.roleAccent} uppercase tracking-wide`}>
                      {exp.company} —{" "}
                      <span className="text-slate-400 font-normal lowercase italic">{exp.location}</span>
                    </div>
                    <ul
                      className={`list-disc pl-4 space-y-1.5 text-xs text-slate-700 mt-2 ${
                        isOptimized
                          ? `${tc.expHighlightBg} p-3 border-l-4 ${tc.expHighlightBorder} rounded-r text-slate-900`
                          : ""
                      }`}
                    >
                      {bullets.map((b, i) => (
                        <li key={i} className="leading-relaxed">
                          {renderText(b)}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.volunteerWork && data.volunteerWork.length > 0 && (
          <div className="space-y-4 pt-2">
            <h2 className={h2Modern("font-sans")}>Volunteer & Outreach</h2>
            <div className="space-y-2">
              {data.volunteerWork.map((vol, index) => (
                <div
                  key={index}
                  className="text-xs text-slate-705 flex items-start gap-2 bg-slate-50/50 p-2.5 rounded border border-slate-100"
                >
                  <span className={`w-1.5 h-1.5 ${tc.sidebarDot} rounded-full mt-1.5 shrink-0`} />
                  <span>{renderText(vol)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.projects && data.projects.length > 0 && (
          <div className="space-y-4 pt-2">
            <h2 className={h2Modern()}>Portfolio & Github Repos</h2>
            <div className="space-y-3">
              {data.projects.map((proj) => (
                <div key={proj.id} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-900">
                    <span>{proj.name}</span>
                    {proj.url && (
                      <span className="text-[10px] text-slate-400 font-mono font-normal">{proj.url}</span>
                    )}
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
  );
}

export default memo(ResumeEmbeddedClassic);
