import type { AppLocale } from "../../i18n/types";
import { getActiveMarket } from "./config";

export interface AiWritingContext {
  locale?: string;
  jobMarket?: string;
}

/**
 * Shared AI writing instructions for Hong Kong job applications.
 * Prepended to server-side Gemini prompts when market is HK.
 */
export function getAiWritingGuide(ctx: AiWritingContext = {}): string {
  const market = getActiveMarket();
  const locale = ctx.locale ?? "en";
  const useChinese = locale === "zh-HK" || locale === "zh-TW";

  const englishBlock = `
Writing standards for ${market.regionLabel} employers:
- Use British English spelling (organise, colour, programme, centre, analyse).
- Professional Hong Kong corporate tone: concise, achievement-led bullets with metrics where reasonable.
- Avoid US-only idioms; prefer internationally understood business English.
- Where visa/right-to-work is relevant, use neutral phrasing (e.g. "Eligible to work in Hong Kong without sponsorship" when applicable).
- Salary references should use HKD per month unless the JD specifies otherwise.
`.trim();

  const chineseBlock = useChinese
    ? `
如輸出包含中文：使用香港繁體中文書面語，避免台灣用詞（例如：軟體→軟件、資訊→信息、履歷→CV/履歷均可、影片→視頻）。
`
    : "";

  return `${englishBlock}${chineseBlock}`;
}
