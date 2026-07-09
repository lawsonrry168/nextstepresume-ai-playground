/** Google Fonts bundle for server-side PDF export (?print=1). Must cover marginalia + token templates + CJK. */
export const GOOGLE_PRINT_FONTS_URL =
  "https://fonts.googleapis.com/css2?" +
  [
    "family=Caveat:wght@500;600;700",
    "family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400",
    "family=Inter:wght@400;500;600;700",
    "family=JetBrains+Mono:wght@400;500;600",
    "family=IBM+Plex+Mono:wght@400;500;600",
    "family=Playfair+Display:wght@500;700",
    "family=Source+Serif+4:wght@400;600;700",
    "family=Public+Sans:wght@400;600;700",
    "family=Noto+Sans+TC:wght@400;500;700",
    "family=Noto+Serif+TC:wght@400;700",
    "family=Noto+Sans+Mono+TC:wght@400;500",
  ].join("&") +
  "&display=swap";

/** Wait until CJK webfonts report loaded (best-effort before Chromium snapshot). */
export async function waitForPrintFontsReady(timeoutMs = 12_000): Promise<void> {
  if (typeof document === "undefined" || !document.fonts?.load) return;
  const families = [
    '400 16px "Noto Sans TC"',
    '700 16px "Noto Sans TC"',
    '400 16px "Noto Serif TC"',
    '400 16px "Fraunces"',
    '400 16px "Inter"',
  ];
  await Promise.race([
    Promise.all(families.map((spec) => document.fonts.load(spec).catch(() => undefined))),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
  await Promise.race([
    document.fonts.ready,
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}
