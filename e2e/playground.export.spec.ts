import { test, expect } from "@playwright/test";
import { clickExportOption, gotoSimulator, seedPlaygroundStorage } from "./helpers/playground";

test.describe("playground export downloads", () => {
  test.beforeEach(async ({ page }) => {
    await seedPlaygroundStorage(page);
  });

  test("downloads json export from preview menu", async ({ page }) => {
    await gotoSimulator(page);

    const downloadPromise = page.waitForEvent("download");
    await clickExportOption(page, "export-json");

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("data.json");
  });

  test("downloads visual pdf export from preview menu", async ({ page }) => {
    test.setTimeout(90_000);

    await gotoSimulator(page);

    const downloadPromise = page.waitForEvent("download", { timeout: 60_000 });
    await clickExportOption(page, "export-pdf-visual");

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^NextStepResume_.+\.pdf$/);
  });
});
