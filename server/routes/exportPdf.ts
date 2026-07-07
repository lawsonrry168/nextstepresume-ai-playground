import type { Express, Request, Response } from "express";
import { handleExportPdf } from "../exportPdfHandler.ts";

export function registerExportPdfRoutes(app: Express): void {
  app.post("/api/export/pdf", (req: Request, res: Response) => {
    void handleExportPdf(req, res);
  });
}
