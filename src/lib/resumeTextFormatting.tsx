import { type ReactNode } from "react";

export function highlightKeywordsInString(
  text: string,
  matched: string[],
  marginalia = false,
): ReactNode {
  if (!text || matched.length === 0) return text;

  const validKeywords = matched.filter(Boolean);
  if (validKeywords.length === 0) return text;

  const sorted = [...validKeywords].sort((a, b) => b.length - a.length);
  const cleanRegex = sorted.map((w) => w.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"));
  const regex = new RegExp(`\\b(${cleanRegex.join("|")})\\b`, "gi");
  const tokens = text.split(regex);
  if (tokens.length <= 1) return text;

  return (
    <>
      {tokens.map((token, idx) => {
        const isMatch = sorted.some((word) => word.toLowerCase() === token.toLowerCase());
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

export function renderFormattedResumeText(
  text: string | undefined,
  matchedKeywords: string[] = [],
  highlightMatcherActive = false,
  marginalia = false,
): ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return (
    <>
      {parts.map((part, idx) => {
        let isBold = false;
        let isItalic = false;
        let innerText = part;

        if (part.startsWith("**") && part.endsWith("**")) {
          innerText = part.slice(2, -2);
          isBold = true;
        } else if (part.startsWith("*") && part.endsWith("*")) {
          innerText = part.slice(1, -1);
          isItalic = true;
        }

        let content: ReactNode = innerText;
        if (highlightMatcherActive && matchedKeywords.length > 0) {
          content = highlightKeywordsInString(innerText, matchedKeywords, marginalia);
        }

        if (isBold) {
          return (
            <strong key={idx} className="font-bold">
              {content}
            </strong>
          );
        }
        if (isItalic) {
          return (
            <em key={idx} className="italic">
              {content}
            </em>
          );
        }
        return <span key={idx}>{content}</span>;
      })}
    </>
  );
}
