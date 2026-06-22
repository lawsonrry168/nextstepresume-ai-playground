import { PDFParse } from "pdf-parse";

const MAX_PDF_BYTES = 5 * 1024 * 1024;

export function validatePdfBuffer(buffer: Buffer): void {
  if (!buffer || buffer.length === 0) {
    throw new Error("Empty PDF file");
  }
  if (buffer.length > MAX_PDF_BYTES) {
    throw new Error("PDF exceeds 5MB limit");
  }
  const header = buffer.subarray(0, 5).toString("utf8");
  if (!header.startsWith("%PDF")) {
    throw new Error("Invalid PDF file format");
  }
}

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  validatePdfBuffer(buffer);

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return (result.text || "").replace(/\r\n/g, "\n").trim();
  } finally {
    await parser.destroy();
  }
}
