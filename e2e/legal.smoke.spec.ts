import { test, expect } from "@playwright/test";

test.describe("legal pages", () => {
  test("privacy policy renders", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("#legal-page-privacy")).toBeVisible();
    await expect(page.locator("h1")).toContainText(/Privacy|私隱/);
    await expect(page.locator("a[href='/terms']")).toBeVisible();
    await expect(page.locator("#legal-back-home")).toBeVisible();
  });

  test("terms of service renders", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.locator("#legal-page-terms")).toBeVisible();
    await expect(page.locator("h1")).toContainText(/Terms|服務條款/);
    await expect(page.locator("a[href='/privacy']")).toBeVisible();
  });
});
