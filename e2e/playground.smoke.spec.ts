import { test, expect } from "@playwright/test";

test.describe("playground smoke", () => {
  test("loads app shell and resume preview", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/NextStepResume/i);

    const root = page.locator("#root");
    await expect(root).not.toBeEmpty();

    const preview = page.locator(
      "#resume-container-box, #resume-container-box-workspace, .resume-template-marginalia",
    );
    await expect(preview.first()).toBeVisible();
  });

  test("health endpoint responds", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { status: string; ai_enabled: boolean };
    expect(body.status).toBe("ok");
    expect(typeof body.ai_enabled).toBe("boolean");
  });

  test("locale switcher is visible", async ({ page }) => {
    await page.goto("/");
    const switcher = page.locator("#locale-switcher");
    await expect(switcher).toBeVisible();
    await expect(switcher).toBeEnabled();
  });
});
