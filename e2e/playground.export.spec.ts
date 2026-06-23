import { test, expect } from "@playwright/test";
import { clickExportOption, gotoSimulator, seedPlaygroundStorage } from "./helpers/playground";

test.describe("playground export downloads", () => {
  test.beforeEach(async ({ page }) => {
    await seedPlaygroundStorage(page);
  });

  test("json export triggers client-side download anchor", async ({ page }) => {
    await gotoSimulator(page);

    await page.evaluate(() => {
      const win = window as Window & { __nsrDownloadName?: string | null };
      win.__nsrDownloadName = null;
      const originalCreate = document.createElement.bind(document);
      document.createElement = function createElement(tag: string) {
        const node = originalCreate(tag);
        if (tag.toLowerCase() === "a") {
          const anchor = node as HTMLAnchorElement;
          const setAttribute = anchor.setAttribute.bind(anchor);
          anchor.setAttribute = (name: string, value: string) => {
            setAttribute(name, value);
            if (name === "download") win.__nsrDownloadName = value;
          };
        }
        return node;
      };
    });

    await clickExportOption(page, "export-json");

    await expect
      .poll(async () =>
        page.evaluate(() => (window as Window & { __nsrDownloadName?: string | null }).__nsrDownloadName),
      )
      .toBe("data.json");
  });

  test("visual pdf export shows success toast", async ({ page }) => {
    test.setTimeout(90_000);

    await gotoSimulator(page);
    await clickExportOption(page, "export-pdf-visual");

    await expect(page.getByText(/Visual PDF downloaded/i)).toBeVisible({ timeout: 60_000 });
  });
});
