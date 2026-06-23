import { test, expect, type Page } from "@playwright/test";

async function seedPlaygroundStorage(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("nsr_tour_seen", "true");
    localStorage.setItem("nsr_subscription_plan", "pro");
    localStorage.setItem("nsr_playground_sidebar_collapsed", "false");
  });
}

async function gotoSimulator(page: Page) {
  await page.goto("/");
  await expect(page.locator("#screen-simulator")).toBeVisible();
  await expect(page.locator("#preview-col")).toBeVisible();
}

test.describe("playground smoke", () => {
  test.beforeEach(async ({ page }) => {
    await seedPlaygroundStorage(page);
  });

  test("loads app shell and resume preview", async ({ page }) => {
    await gotoSimulator(page);
    await expect(page).toHaveTitle(/NextStepResume/i);

    const root = page.locator("#root");
    await expect(root).not.toBeEmpty();

    const preview = page.locator("#resume-container-box, #resume-container-box-workspace");
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
    await gotoSimulator(page);
    const switcher = page.locator("#locale-switcher");
    await expect(switcher).toBeVisible();
    await expect(switcher).toBeEnabled();
  });

  test("cycles locale and persists selection", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("nsr_ui_locale", "en"));
    await page.reload();

    await expect(page.locator("html")).toHaveAttribute("lang", "en-HK");
    await expect(page.locator('[data-testid="locale-switcher-label"]')).toHaveText("English");
    await expect(page.locator("#content-tab-view")).toBeVisible();

    await page.locator("#locale-switcher").click();

    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem("nsr_ui_locale")))
      .toBe("zh-HK");
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-HK");
    await expect(page.locator('[data-testid="locale-switcher-label"]')).toHaveText("繁體中文（香港）");
    await expect(page.locator("#subtab-content")).toContainText("履歷編輯");
  });

  test("switches resume template from preview tab", async ({ page }) => {
    await gotoSimulator(page);
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
    await gotoSimulator(page);

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

  test("opens studio fullscreen from sidebar", async ({ page }) => {
    await gotoSimulator(page);
    await page.locator("#workspace-btn-preview-mode").click();
    await expect(page.locator("#immersive-preview-studio")).toBeVisible();
    await expect(page.locator("#canvas-studio-viewport")).toBeVisible();
  });

  test("export menu lists pdf visual option", async ({ page }) => {
    await gotoSimulator(page);
    await page.locator('#preview-util-header button[title="Export"]').click();
    await page.locator("#header-btn-export-menu").click();
    await expect(page.locator("#export-pdf-visual")).toBeVisible();
    await expect(page.locator("#export-json")).toBeVisible();
  });
});
