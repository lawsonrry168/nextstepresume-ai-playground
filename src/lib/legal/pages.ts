export type LegalPageId = "privacy" | "terms";

export const LEGAL_PATHS: Record<LegalPageId, string> = {
  privacy: "/privacy",
  terms: "/terms",
};

export const LEGAL_PAGE_SECTIONS: Record<LegalPageId, readonly string[]> = {
  privacy: ["intro", "collect", "use", "storage", "thirdParties", "rights", "contact"],
  terms: ["intro", "service", "accounts", "acceptableUse", "ai", "billing", "liability", "law"],
};

export function resolveLegalPageFromPath(pathname: string): LegalPageId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === LEGAL_PATHS.privacy) return "privacy";
  if (normalized === LEGAL_PATHS.terms) return "terms";
  return null;
}

export function legalPageTitleKey(pageId: LegalPageId): string {
  return `legal.${pageId}.title`;
}

export function legalPageUpdatedKey(pageId: LegalPageId): string {
  return `legal.${pageId}.updated`;
}

export function legalSectionTitleKey(pageId: LegalPageId, sectionId: string): string {
  return `legal.${pageId}.sections.${sectionId}.title`;
}

export function legalSectionBodyKey(pageId: LegalPageId, sectionId: string): string {
  return `legal.${pageId}.sections.${sectionId}.body`;
}
