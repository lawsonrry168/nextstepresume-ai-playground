import type { PersonalInfo } from "../types";

/** Optional HK CV lines for template rendering. */
export function getHkPersonalMetaLines(info: PersonalInfo): string[] {
  const lines: string[] = [];
  if (info.rightToWork?.trim()) lines.push(info.rightToWork.trim());
  if (info.noticePeriod?.trim()) lines.push(`Notice: ${info.noticePeriod.trim()}`);
  if (info.expectedSalary?.trim()) lines.push(`Expected: ${info.expectedSalary.trim()}`);
  return lines;
}
