import { test, expect } from "@playwright/test";
import { clickExportOption, gotoSimulator, seedPlaygroundStorage } from "./helpers/playground";

test.describe("playground export downloads", () => {
  test.beforeEach(async ({ page }) => {
    await seedPlaygroundStorage(page);
  });

  test("json export triggers client-side download anchor", async ({ page }) => {
    await gotoSimulator(page);
    await clickExportOption(page, "export-json");

    await expect
      .poll(async () =>
        page.evaluate(() => (window as Window & { __nsrJsonExportClicked?: boolean }).__nsrJsonExportClicked),
      )
      .toBe(true);
  });

  test("visual pdf export shows success toast", async ({ page }) => {
    test.setTimeout(90_000);

    await gotoSimulator(page);
    await clickExportOption(page, "export-pdf-visual");

    await expect(page.getByText(/Visual PDF downloaded/i)).toBeVisible({ timeout: 60_000 });
  });
});
