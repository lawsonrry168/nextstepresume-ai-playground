import fs from "fs";
import multer from "multer";
import type { Express } from "express";
import { parseResumeText } from "../../src/lib/resumeTextParser.ts";
import { extractTextFromPdfBuffer } from "../../src/lib/pdfExtract.ts";

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb: multer.FileFilterCallback) => {
    const isPdf =
      file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
    if (isPdf) cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});

export function registerResumeRoutes(app: Express): void {
  app.post("/api/resume/parse", (req, res) => {
    const { text, resumeData } = req.body;

    if (resumeData && typeof resumeData === "object") {
      return res.json({
        success: true,
        resumeData,
        meta: { source: "parser", simulated: false },
      });
    }

    if (!text || typeof text !== "string" || text.trim().length < 20) {
      return res.status(400).json({ error: "text is required (min 20 characters) or provide resumeData" });
    }

    try {
      const parsed = parseResumeText(text);
      return res.json({
        success: true,
        resumeData: parsed,
        meta: { source: "parser", simulated: false },
      });
    } catch (err: unknown) {
      console.error("Resume parse error:", err);
      return res.status(422).json({
        error: "Could not parse resume text. Try clearer section headers (SUMMARY, EXPERIENCE, SKILLS).",
      });
    }
  });

  app.post("/api/resume/parse-pdf", pdfUpload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required (form field: file)" });
    }

    try {
      const text = await extractTextFromPdfBuffer(req.file.buffer);
      if (!text || text.length < 20) {
        return res.status(422).json({
          error: "PDF contains insufficient extractable text. Use a text-based PDF or paste content manually.",
        });
      }

      const parsed = parseResumeText(text);
      return res.json({
        success: true,
        resumeData: parsed,
        extractedTextLength: text.length,
        meta: { source: "parser", simulated: false },
      });
    } catch (err: unknown) {
      console.error("PDF parse error:", err);
      const message = err instanceof Error ? err.message : "Failed to parse PDF resume";
      return res.status(422).json({ error: message });
    }
  });
}
