import type { Express } from "express";
import { getNsrAuth } from "../auth/requestAuth.ts";
import {
  getPostgresSyncStore,
  isPostgresSyncConfigured,
} from "../sync/postgresSyncStore.ts";
import { normalizeTemplateStyle } from "../../src/lib/resumeTemplateCatalog.ts";
import type { ApplicationPackage } from "../../src/types.ts";

function requireAuthedUser(req: Parameters<typeof getNsrAuth>[0]) {
  const auth = getNsrAuth(req);
  if (!auth) return null;
  return auth;
}

function isApplicationPackageArray(value: unknown): value is ApplicationPackage[] {
  return Array.isArray(value);
}

export function registerSyncRoutes(app: Express): void {
  app.get("/api/sync/workspace", async (req, res) => {
    if (!isPostgresSyncConfigured()) {
      res.status(503).json({ error: "sync_not_configured" });
      return;
    }

    const auth = requireAuthedUser(req);
    if (!auth) {
      res.status(401).json({ error: "auth_required" });
      return;
    }

    try {
      const record = await getPostgresSyncStore().getWorkspace(auth.user.id);
      if (!record) {
        res.status(404).json({ error: "not_found" });
        return;
      }
      res.json({
        resumeData: record.resumeData,
        jobDescription: record.jobDescription,
        activeTemplate: normalizeTemplateStyle(record.templateId),
        updatedAt: record.updatedAt,
      });
    } catch (err) {
      console.error("[sync/workspace] get failed", err);
      res.status(500).json({ error: "sync_read_failed" });
    }
  });

  app.put("/api/sync/workspace", async (req, res) => {
    if (!isPostgresSyncConfigured()) {
      res.status(503).json({ error: "sync_not_configured" });
      return;
    }

    const auth = requireAuthedUser(req);
    if (!auth) {
      res.status(401).json({ error: "auth_required" });
      return;
    }

    const resumeData = req.body?.resumeData;
    const jobDescription = typeof req.body?.jobDescription === "string" ? req.body.jobDescription : "";
    const activeTemplate = normalizeTemplateStyle(
      typeof req.body?.activeTemplate === "string" ? req.body.activeTemplate : undefined,
    );
    const updatedAt =
      typeof req.body?.updatedAt === "string" ? req.body.updatedAt : new Date().toISOString();

    if (!resumeData || typeof resumeData !== "object") {
      res.status(400).json({ error: "invalid_resume_data" });
      return;
    }

    try {
      const saved = await getPostgresSyncStore().upsertWorkspace(auth.user.id, {
        resumeData: resumeData as Record<string, unknown>,
        jobDescription,
        templateId: activeTemplate,
        updatedAt,
      });
      res.json({
        ok: true,
        updatedAt: saved.updatedAt,
        activeTemplate: normalizeTemplateStyle(saved.templateId),
      });
    } catch (err) {
      console.error("[sync/workspace] put failed", err);
      res.status(500).json({ error: "sync_write_failed" });
    }
  });

  app.get("/api/sync/application-packages", async (req, res) => {
    if (!isPostgresSyncConfigured()) {
      res.status(503).json({ error: "sync_not_configured" });
      return;
    }

    const auth = requireAuthedUser(req);
    if (!auth) {
      res.status(401).json({ error: "auth_required" });
      return;
    }

    try {
      const record = await getPostgresSyncStore().getApplicationPackages(auth.user.id);
      if (!record) {
        res.json({ packages: [], updatedAt: null });
        return;
      }
      res.json({
        packages: record.packages,
        updatedAt: record.updatedAt,
      });
    } catch (err) {
      console.error("[sync/application-packages] get failed", err);
      res.status(500).json({ error: "sync_read_failed" });
    }
  });

  app.put("/api/sync/application-packages", async (req, res) => {
    if (!isPostgresSyncConfigured()) {
      res.status(503).json({ error: "sync_not_configured" });
      return;
    }

    const auth = requireAuthedUser(req);
    if (!auth) {
      res.status(401).json({ error: "auth_required" });
      return;
    }

    const packages = req.body?.packages;
    if (!isApplicationPackageArray(packages)) {
      res.status(400).json({ error: "invalid_packages" });
      return;
    }

    const updatedAt =
      typeof req.body?.updatedAt === "string" ? req.body.updatedAt : new Date().toISOString();

    try {
      const saved = await getPostgresSyncStore().upsertApplicationPackages(auth.user.id, {
        packages,
        updatedAt,
      });
      res.json({
        ok: true,
        packages: saved.packages,
        updatedAt: saved.updatedAt,
      });
    } catch (err) {
      console.error("[sync/application-packages] put failed", err);
      res.status(500).json({ error: "sync_write_failed" });
    }
  });

  app.get("/api/sync/canvas-layout", async (req, res) => {
    if (!isPostgresSyncConfigured()) {
      res.status(503).json({ error: "sync_not_configured" });
      return;
    }

    const auth = requireAuthedUser(req);
    if (!auth) {
      res.status(401).json({ error: "auth_required" });
      return;
    }

    try {
      const record = await getPostgresSyncStore().getCanvasLayout(auth.user.id);
      if (!record) {
        res.status(404).json({ error: "not_found" });
        return;
      }
      res.json({
        layoutPositions: record.layoutPositions,
        canvasDocument: record.canvasDocument,
        canvasElements: record.canvasElements,
        updatedAt: record.updatedAt,
      });
    } catch (err) {
      console.error("[sync/canvas-layout] get failed", err);
      res.status(500).json({ error: "sync_read_failed" });
    }
  });

  app.put("/api/sync/canvas-layout", async (req, res) => {
    if (!isPostgresSyncConfigured()) {
      res.status(503).json({ error: "sync_not_configured" });
      return;
    }

    const auth = requireAuthedUser(req);
    if (!auth) {
      res.status(401).json({ error: "auth_required" });
      return;
    }

    const layoutPositions =
      req.body?.layoutPositions && typeof req.body.layoutPositions === "object"
        ? req.body.layoutPositions
        : {};
    const canvasDocument =
      req.body?.canvasDocument && typeof req.body.canvasDocument === "object"
        ? req.body.canvasDocument
        : {};
    const canvasElements = Array.isArray(req.body?.canvasElements) ? req.body.canvasElements : [];
    const updatedAt =
      typeof req.body?.updatedAt === "string" ? req.body.updatedAt : new Date().toISOString();

    try {
      const saved = await getPostgresSyncStore().upsertCanvasLayout(auth.user.id, {
        layoutPositions,
        canvasDocument,
        canvasElements,
        updatedAt,
      });
      res.json({
        ok: true,
        layoutPositions: saved.layoutPositions,
        canvasDocument: saved.canvasDocument,
        canvasElements: saved.canvasElements,
        updatedAt: saved.updatedAt,
      });
    } catch (err) {
      console.error("[sync/canvas-layout] put failed", err);
      res.status(500).json({ error: "sync_write_failed" });
    }
  });
}
