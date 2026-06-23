import { expect, type Page } from "@playwright/test";

export async function seedPlaygroundStorage(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("nsr_tour_seen", "true");
    localStorage.setItem("nsr_subscription_plan", "pro");
    localStorage.setItem("nsr_playground_sidebar_collapsed", "false");
  });
}

export async function gotoSimulator(page: Page) {
  await page.goto("/");
  await expect(page.locator("#screen-simulator")).toBeVisible();
  await expect(page.locator("#preview-col")).toBeVisible();
}

export async function openExportMenu(page: Page) {
  await page.locator('#preview-util-header button[title="Export"]').click();
  await page.locator("#header-btn-export-menu").click();
}

export async function clickExportOption(page: Page, optionId: string) {
  await openExportMenu(page);
  await page.locator(`#${optionId}`).click();
}
