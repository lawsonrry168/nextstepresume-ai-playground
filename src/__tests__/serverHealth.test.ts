import type { Express, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { registerHealthRoutes } from "../../server/routes/health.ts";

describe("registerHealthRoutes", () => {
  it("exposes /api/health with status and ai flag", () => {
    let handler: ((req: Request, res: Response) => void) | undefined;
    const app = {
      get: (path: string, fn: (req: Request, res: Response) => void) => {
        if (path === "/api/health") handler = fn;
      },
    } as unknown as Express;

    registerHealthRoutes(app, true);
    expect(handler).toBeDefined();

    const json = vi.fn();
    handler!({} as Request, { json } as unknown as Response);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "ok",
        ai_enabled: true,
        timestamp: expect.any(String),
      }),
    );
  });
});
