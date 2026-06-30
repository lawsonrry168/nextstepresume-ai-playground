import type { CoverLetterResult } from "../types";
import { downloadDocxFromHtml } from "./resumeDocxExport";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildCoverLetterDocxHtml(letter: CoverLetterResult, title = "Cover Letter"): string {
  const bodyHtml = [
    `<p>${escapeHtml(letter.salutation)}</p>`,
    `<p>${escapeHtml(letter.opening)}</p>`,
    ...letter.bodyParagraphs.map((p) => `<p>${escapeHtml(p)}</p>`),
    `<p>${escapeHtml(letter.closing)}</p>`,
    `<p>${escapeHtml(letter.signature).replace(/\n/g, "<br/>")}</p>`,
  ].join("\n");

  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <title>${escapeHtml(title)}</title>
      <style>
        body { font-family: 'Calibri', 'Georgia', serif; line-height: 1.5; padding: 1in; color: #222; font-size: 11pt; }
        p { margin-bottom: 12pt; text-align: justify; }
      </style>
    </head>
    <body>${bodyHtml}</body>
    </html>
  `;
}

export function downloadCoverLetterDocx(letter: CoverLetterResult, filenameBase = "cover_letter"): void {
  const html = buildCoverLetterDocxHtml(letter);
  downloadDocxFromHtml(html, `${filenameBase.replace(/\s+/g, "_")}.doc`);
}
