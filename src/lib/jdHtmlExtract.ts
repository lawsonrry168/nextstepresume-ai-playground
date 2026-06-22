/** Strip HTML to plain text suitable for JD parsing. */
export function stripHtmlToText(html: string): string {
  let text = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  text = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return text;
}

export function extractHtmlPageHints(html: string): {
  pageTitle: string;
  ogTitle: string;
  ogDescription: string;
  h1: string;
} {
  const pick = (pattern: RegExp) => {
    const m = html.match(pattern);
    return m?.[1]?.trim().replace(/\s+/g, " ") ?? "";
  };

  const pageTitle = pick(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const ogTitle = pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    || pick(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  const ogDescription = pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
    || pick(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
  const h1 = pick(/<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, "").trim();

  return { pageTitle, ogTitle, ogDescription, h1 };
}

export function buildJobDescriptionFromHtml(html: string): {
  jobDescription: string;
  pageTitle: string;
  headline: string;
} {
  const hints = extractHtmlPageHints(html);
  const bodyText = stripHtmlToText(html);
  const headline =
    hints.ogTitle ||
    (hints.pageTitle && /[|\-–—]/.test(hints.pageTitle) ? hints.pageTitle : "") ||
    hints.h1 ||
    hints.pageTitle;
  const intro = [headline, hints.ogDescription].filter(Boolean).join("\n\n");

  let jobDescription = bodyText;
  if (bodyText.length > 8000) {
    jobDescription = bodyText.slice(0, 8000).trim() + "\n\n[…內容已截斷]";
  }

  if (intro && !jobDescription.startsWith(intro.slice(0, 40))) {
    jobDescription = intro ? `${intro}\n\n${jobDescription}` : jobDescription;
  }

  return {
    jobDescription: jobDescription.trim(),
    pageTitle: hints.pageTitle,
    headline,
  };
}
