import { test, expect } from "@playwright/test";
import {
  clickStudioExportOption,
  gotoStudio,
  readE2eExportFlags,
  seedPlaygroundStorage,
  syncE2eServerPlan,
} from "./helpers/playground";

const PRESET_IDS = ["modern", "classic", "minimalist", "two-column", "magazine", "compact"] as const;
const PAGE_INNER_WIDTH = 698;

async function applyGlobalPreset(page: import("@playwright/test").Page, presetId: string) {
  const select = page.locator("#canvas-layout-panel select.canvas-layout-preset-select");
  await expect(select).toBeVisible();
  await select.selectOption(presetId);
  await page.waitForTimeout(500);
}

async function readSectionMetrics(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('[id^="free-layout-section-"]'),
    );
    return sections.map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        id: el.id.replace("free-layout-section-", ""),
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        bottom: Math.round(rect.bottom),
        right: Math.round(rect.right),
      };
    });
  });
}

function assertNoVerticalOverlapInColumn(
  sections: Array<{ id: string; x: number; y: number; bottom: number }>,
): void {
  const columns = new Map<number, typeof sections>();
  for (const s of sections) {
    const anchor = [...columns.keys()].find((k) => Math.abs(k - s.x) <= 64) ?? s.x;
    const list = columns.get(anchor) ?? [];
    list.push(s);
    columns.set(anchor, list);
  }
  for (const column of columns.values()) {
    const sorted = [...column].sort((a, b) => a.y - b.y);
    for (let i = 1; i < sorted.length; i++) {
      expect(
        sorted[i].y,
        `${sorted[i].id} overlaps ${sorted[i - 1].id} vertically`,
      ).toBeGreaterThanOrEqual(sorted[i - 1].bottom - 6);
    }
  }
}

test.describe("all layout presets in studio", () => {
  test.beforeAll(async ({ request }) => {
    await syncE2eServerPlan(request);
  });

  test.beforeEach(async ({ page }) => {
    await seedPlaygroundStorage(page);
  });

  for (const presetId of PRESET_IDS) {
    test(`preset ${presetId} renders without overlapping sections`, async ({ page }) => {
      await gotoStudio(page);
      await applyGlobalPreset(page, presetId);

      const metrics = await readSectionMetrics(page);
      expect(metrics.length).toBeGreaterThanOrEqual(4);

      for (const section of metrics) {
        expect(section.width).toBeGreaterThan(120);
        expect(section.width).toBeLessThanOrEqual(PAGE_INNER_WIDTH + 80);
        expect(section.height).toBeGreaterThan(40);
      }

      assertNoVerticalOverlapInColumn(metrics);
    });
  }

  test("each preset allows visual PDF export", async ({ page }) => {
    test.setTimeout(180_000);

    await gotoStudio(page);

    for (const presetId of PRESET_IDS) {
      await applyGlobalPreset(page, presetId);
      await clickStudioExportOption(page, "export-pdf-visual");
      await expect
        .poll(async () => (await readE2eExportFlags(page)).__NSR_E2E_PDF_EXPORTED__)
        .toBe(true);
      await page.evaluate(() => {
        const win = window as Window & { __NSR_E2E_PDF_EXPORTED__?: boolean };
        win.__NSR_E2E_PDF_EXPORTED__ = false;
      });
    }
  });
});
