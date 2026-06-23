import { test, expect } from "@playwright/test";
import {
  clickStudioExportOption,
  gotoStudio,
  readE2eExportFlags,
  seedPlaygroundStorage,
} from "./helpers/playground";

test.describe("studio export", () => {
  test.beforeEach(async ({ page }) => {
    await seedPlaygroundStorage(page);
  });

  test("json export completes from studio menu", async ({ page }) => {
    await gotoStudio(page);
    await clickStudioExportOption(page, "export-json");

    await expect.poll(async () => (await readE2eExportFlags(page)).__NSR_E2E_JSON_EXPORTED__).toBe(true);
  });

  test("visual pdf export completes from studio menu", async ({ page }) => {
    test.setTimeout(90_000);

    await gotoStudio(page);
    await clickStudioExportOption(page, "export-pdf-visual");

    await expect.poll(async () => (await readE2eExportFlags(page)).__NSR_E2E_PDF_EXPORTED__).toBe(true);
    await expect(page.getByText(/Visual PDF downloaded/i)).toBeVisible({ timeout: 15_000 });
  });
});
