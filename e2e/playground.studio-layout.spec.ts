import { test, expect } from "@playwright/test";
import { gotoStudio, seedPlaygroundStorage, syncE2eServerPlan } from "./helpers/playground";

const PAGE_INNER_WIDTH = 698;

test.describe("playground studio layout", () => {
  test.beforeAll(async ({ request }) => {
    await syncE2eServerPlan(request);
  });

  test.beforeEach(async ({ page }) => {
    await seedPlaygroundStorage(page);
  });

  test("two-column layout keeps sections narrower than full page width", async ({ page }) => {
    await gotoStudio(page);
    await expect(page.locator("#canvas-layout-panel")).toBeVisible();

    const twoColBtn = page.locator('#canvas-layout-panel button[aria-label*="Two columns"]');
    await expect(twoColBtn).toBeEnabled();
    await twoColBtn.click();

    await expect
      .poll(async () => {
        const boxes = await page.evaluate(() => {
          const ids = ["header", "summary", "experience"];
          return ids.map((id) => {
            const el = document.querySelector(`#free-layout-section-${id}`);
            if (!el) return null;
            const rect = el.getBoundingClientRect();
            return { id, width: rect.width, x: rect.left };
          });
        });
        return boxes.filter(Boolean);
      })
      .toHaveLength(3);

    const metrics = await page.evaluate(() => {
      const ids = ["header", "summary", "experience"];
      return ids.map((id) => {
        const el = document.querySelector(`#free-layout-section-${id}`) as HTMLElement | null;
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { id, width: Math.round(rect.width), x: Math.round(rect.left) };
      });
    });

    const valid = metrics.filter((m): m is { id: string; width: number; x: number } => m !== null);
    expect(valid.length).toBe(3);

    for (const section of valid) {
      expect(section.width).toBeLessThan(PAGE_INNER_WIDTH * 0.85);
      expect(section.width).toBeGreaterThan(200);
    }

    const xs = new Set(valid.map((s) => s.x));
    expect(xs.size).toBeGreaterThanOrEqual(2);

    const yPairs = await page.evaluate(() => {
      const ids = ["header", "summary", "experience"];
      const byX = new Map<number, Array<{ id: string; top: number; bottom: number }>>();
      for (const id of ids) {
        const el = document.querySelector(`#free-layout-section-${id}`);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const x = Math.round(rect.left);
        const anchor = [...byX.keys()].find((k) => Math.abs(k - x) <= 48) ?? x;
        const list = byX.get(anchor) ?? [];
        list.push({ id, top: rect.top, bottom: rect.bottom });
        byX.set(anchor, list);
      }
      return [...byX.values()];
    });

    for (const column of yPairs) {
      const sorted = [...column].sort((a, b) => a.top - b.top);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].top).toBeGreaterThanOrEqual(sorted[i - 1].bottom - 4);
      }
    }
  });

  test("stack layout resets sections to single column", async ({ page }) => {
    await gotoStudio(page);

    await page.locator('#canvas-layout-panel button[aria-label*="Two columns"]').click();
    await page.waitForTimeout(400);

    await page.locator('#canvas-layout-panel button[aria-label*="Single column"]').click();

    await expect
      .poll(async () => {
        const xs = await page.evaluate(() => {
          const ids = ["header", "summary", "experience"];
          return ids.map((id) => {
            const el = document.querySelector(`#free-layout-section-${id}`);
            return el ? Math.round(el.getBoundingClientRect().left) : null;
          });
        });
        return xs.filter((x) => x !== null);
      })
      .toHaveLength(3);

    const xs = await page.evaluate(() => {
      const ids = ["header", "summary", "experience"];
      return ids.map((id) => {
        const el = document.querySelector(`#free-layout-section-${id}`);
        return el ? Math.round(el.getBoundingClientRect().left) : null;
      });
    });
    const uniqueX = new Set(xs.filter((x) => x !== null));
    expect(uniqueX.size).toBe(1);
  });

  test("selected section shows collapsible resize controls on click", async ({ page }) => {
    await gotoStudio(page);

    const section = page.locator("#canvas-studio-viewport #free-layout-section-header");
    await expect(section).toBeVisible();
    await section.click();

    const resizeToggle = section.locator('button[title="Resize"]');
    await expect(resizeToggle).toBeVisible();

    await resizeToggle.click();
    await expect(section.locator('input[type="range"]')).toHaveCount(2);
  });

  test("canvas viewport auto-fits when the window is resized", async ({ page }) => {
    await gotoStudio(page);

    await page.setViewportSize({ width: 1120, height: 860 });

    await expect
      .poll(async () => {
        const metrics = await page.evaluate(() => {
          const stage = document.querySelector("#canvas-studio-viewport .canvas-studio-stage") as HTMLElement | null;
          const pageSheet = document.querySelector(
            "#canvas-studio-viewport .canvas-page-sheet-paper--a4",
          ) as HTMLElement | null;
          if (!stage || !pageSheet) return null;
          const stageRect = stage.getBoundingClientRect();
          const sheetRect = pageSheet.getBoundingClientRect();
          return {
            stageWidth: Math.round(stageRect.width),
            sheetWidth: Math.round(sheetRect.width),
          };
        });
        return metrics ? metrics.sheetWidth < metrics.stageWidth : null;
      })
      .toBe(true);

    const metrics = await page.evaluate(() => {
      const stage = document.querySelector("#canvas-studio-viewport .canvas-studio-stage") as HTMLElement | null;
      const pageSheet = document.querySelector(
        "#canvas-studio-viewport .canvas-page-sheet-paper--a4",
      ) as HTMLElement | null;
      if (!stage || !pageSheet) return null;
      const stageRect = stage.getBoundingClientRect();
      const sheetRect = pageSheet.getBoundingClientRect();
      return {
        stageWidth: Math.round(stageRect.width),
        sheetWidth: Math.round(sheetRect.width),
      };
    });

    expect(metrics).not.toBeNull();
    expect(metrics!.sheetWidth).toBeLessThan(metrics!.stageWidth);
  });

  test("single-page preview keeps the A4 sheet within the viewport width", async ({ page }) => {
    await gotoStudio(page);
    await page.locator("#studio-btn-single").click();
    await expect(page.locator("#resume-container-box-workspace")).toBeVisible();

    await page.setViewportSize({ width: 920, height: 900 });

    await expect
      .poll(async () => {
        const metrics = await page.evaluate(() => {
          const container = document.querySelector("#resume-container-box-workspace") as HTMLElement | null;
          const sheet = container?.querySelector(
            ".preview-resume-sheet, #resume-printable-sheet",
          ) as HTMLElement | null;
          if (!container || !sheet) return null;
          const containerRect = container.getBoundingClientRect();
          const sheetRect = sheet.getBoundingClientRect();
          return {
            containerWidth: Math.round(containerRect.width),
            sheetWidth: Math.round(sheetRect.width),
          };
        });
        return metrics ? metrics.sheetWidth < metrics.containerWidth : null;
      })
      .toBe(true);

    const metrics = await page.evaluate(() => {
      const container = document.querySelector("#resume-container-box-workspace") as HTMLElement | null;
      const sheet = container?.querySelector(
        ".preview-resume-sheet, #resume-printable-sheet",
      ) as HTMLElement | null;
      if (!container || !sheet) return null;
      const containerRect = container.getBoundingClientRect();
      const sheetRect = sheet.getBoundingClientRect();
      return {
        containerWidth: Math.round(containerRect.width),
        sheetWidth: Math.round(sheetRect.width),
      };
    });

    expect(metrics).not.toBeNull();
    expect(metrics!.sheetWidth).toBeLessThan(metrics!.containerWidth);
  });
});
