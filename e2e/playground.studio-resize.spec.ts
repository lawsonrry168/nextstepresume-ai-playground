import { test, expect } from "@playwright/test";
import { gotoStudio, seedPlaygroundStorage, syncE2eServerPlan } from "./helpers/playground";

test.describe("playground studio manual resize", () => {
  test.beforeAll(async ({ request }) => {
    await syncE2eServerPlan(request);
  });

  test.beforeEach(async ({ page }) => {
    await seedPlaygroundStorage(page);
  });

  test("height slider changes section size and persists", async ({ page }) => {
    await gotoStudio(page);

    const section = page.locator("#free-layout-section-summary");
    await expect(section).toBeVisible();
    await section.click();

    await section.locator('button[title="調整大小"], button[title="Resize"]').click();
    const heightRange = section.locator('input[type="range"][aria-label*="高度"], input[type="range"][aria-label*="height"]');
    await expect(heightRange).toBeVisible();

    const before = await section.evaluate((el) => ({
      height: Math.round(el.getBoundingClientRect().height),
    }));

    const max = Number(await heightRange.getAttribute("max"));
    const min = Number(await heightRange.getAttribute("min"));
    const target = Math.min(max, min + 240);

    await heightRange.fill(String(target));

    await expect
      .poll(async () => {
        const rect = await section.evaluate((el) => Math.round(el.getBoundingClientRect().height));
        return rect;
      })
      .not.toBe(before.height);

    const after = await section.evaluate((el) => Math.round(el.getBoundingClientRect().height));
    expect(after).toBeGreaterThan(before.height + 40);
  });

  test("width slider changes section width", async ({ page }) => {
    await gotoStudio(page);

    const section = page.locator("#free-layout-section-header");
    await section.click();
    await section.locator('button[title="調整大小"], button[title="Resize"]').click();

    const widthRange = section.locator('input[type="range"][aria-label*="寬"], input[type="range"][aria-label*="width"]');
    await expect(widthRange).toBeVisible();

    const before = await section.evaluate((el) => Math.round(el.getBoundingClientRect().width));
    const max = Number(await widthRange.getAttribute("max"));
    const min = Number(await widthRange.getAttribute("min"));
    const target = Math.max(min + 80, Math.floor((min + max) / 2));

    await widthRange.fill(String(target));

    await expect
      .poll(async () => section.evaluate((el) => Math.round(el.getBoundingClientRect().width)))
      .not.toBe(before);
  });
});
