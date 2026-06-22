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

  test("switches resume template from preview tab", async ({ page }) => {
    await page.goto("/");
    await page.locator("#subtab-preview").click();
    const picker = page.locator("#preview-tab-template-picker");
    await expect(picker).toBeVisible();

    const variantSelect = picker.locator('[data-testid="template-variant-select"]');
    await variantSelect.selectOption("modern-02");

    await expect
      .poll(async () =>
        page.evaluate(() => localStorage.getItem("nsr_workspace_template")),
      )
      .toBe("modern-02");
  });

  test("jobsdb import smoke with simulated listings", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("nsr_subscription_plan", "pro");
    });
    await page.reload();

    await page.locator("#subtab-applications").click();
    await page.locator("#job-import-mode-jobsdb").click();
    await page.locator("#jobsdb-keyword-input").fill("frontend");
    await page.locator("#jobsdb-search-btn").click();

    const results = page.locator("#jobsdb-results-list button");
    await expect(results.first()).toBeVisible({ timeout: 15_000 });
    await results.first().click();

    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem("nsr_workspace_jd") ?? ""))
      .toContain("frontend");
  });
});
