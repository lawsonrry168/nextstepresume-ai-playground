import { test, expect } from "@playwright/test";
import {
  clickExportOption,
  gotoSimulator,
  readE2eExportFlags,
  seedPlaygroundStorage,
} from "./helpers/playground";

test.describe("playground export downloads", () => {
  test.beforeEach(async ({ page }) => {
    await seedPlaygroundStorage(page);
  });

  test("json export completes from preview menu", async ({ page }) => {
    await gotoSimulator(page);
    await clickExportOption(page, "export-json");

    await expect.poll(async () => (await readE2eExportFlags(page)).__NSR_E2E_JSON_EXPORTED__).toBe(true);
  });

  test("visual pdf export completes with success toast", async ({ page }) => {
    test.setTimeout(90_000);

    await gotoSimulator(page);
    await clickExportOption(page, "export-pdf-visual");

    await expect.poll(async () => (await readE2eExportFlags(page)).__NSR_E2E_PDF_EXPORTED__).toBe(true);
    await expect(page.getByText(/Visual PDF downloaded/i)).toBeVisible({ timeout: 15_000 });
  });

  test("ats pdf export completes with success toast", async ({ page }) => {
    test.setTimeout(90_000);

    await gotoSimulator(page);
    await clickExportOption(page, "export-pdf-ats");

    await expect.poll(async () => (await readE2eExportFlags(page)).__NSR_E2E_ATS_PDF_EXPORTED__).toBe(true);
    await expect(page.getByText(/ATS PDF downloaded/i)).toBeVisible({ timeout: 15_000 });
  });

  test("docx export completes from preview menu", async ({ page }) => {
    await gotoSimulator(page);
    await clickExportOption(page, "export-docx");

    await expect.poll(async () => (await readE2eExportFlags(page)).__NSR_E2E_DOCX_EXPORTED__).toBe(true);
  });
});
