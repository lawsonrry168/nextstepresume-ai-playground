import { AlertCircle } from "lucide-react";
import { t } from "../../i18n/translate";
import { renderFormattedResumeText } from "../../lib/resumeTextFormatting";

export function getDisplayBullets(
  expId: string,
  originalBullets: string[],
  highlightChanges: boolean,
  tailoredBullets?: { experienceId: string; optimizedBullets: string[] }[],
): string[] {
  if (highlightChanges && tailoredBullets) {
    const match = tailoredBullets.find((tb) => tb.experienceId === expId);
    if (match?.optimizedBullets?.length) return match.optimizedBullets;
  }
  return originalBullets;
}

export function isTailoredBullet(
  expId: string,
  highlightChanges: boolean,
  tailoredBullets?: { experienceId: string; optimizedBullets: string[] }[],
): boolean {
  if (!highlightChanges || !tailoredBullets) return false;
  return tailoredBullets.some((tb) => tb.experienceId === expId);
}

export function createResumeTextRenderer(
  matchedKeywords: string[],
  highlightMatcherActive: boolean,
  marginalia = false,
) {
  return (text: string | undefined) =>
    renderFormattedResumeText(text, matchedKeywords, highlightMatcherActive, marginalia);
}

export function MissingSkillsGapBlock({
  missingKeywords,
  highlightMatcherActive,
}: {
  missingKeywords: string[];
  highlightMatcherActive: boolean;
}) {
  if (!highlightMatcherActive || missingKeywords.length === 0) return null;
  return (
    <div
      className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 my-3 text-left no-print font-sans shadow-sm"
      id="skills-match-gap-box"
    >
      <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        <span>⚠️ {t("resumeLivePreview.matchGapsTitle")}</span>
      </div>
      <p className="text-[10px] text-slate-600 leading-normal mt-1">
        These key technical skills are requested by the target Job Description, but missing in your resume. Try
        adding them to rank higher:
      </p>
      <div className="flex flex-wrap gap-1 mt-2">
        {missingKeywords.map((w) => (
          <span
            key={w}
            className="bg-rose-100/90 hover:bg-rose-200 text-rose-800 text-[9px] font-bold px-2 py-0.5 rounded border border-rose-200/85 flex items-center gap-1 select-none"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}
