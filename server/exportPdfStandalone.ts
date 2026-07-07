import { handleExportPdf } from "./exportPdfHandler.ts";

/** Lightweight Vercel serverless entry — PDF only (avoids cold-starting the full Express app). */
export default async function handler(req: { method?: string }, res: Parameters<typeof handleExportPdf>[1]): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  await handleExportPdf(req as Parameters<typeof handleExportPdf>[0], res);
}
