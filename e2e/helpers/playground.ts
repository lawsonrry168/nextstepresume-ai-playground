import { expect, type Page } from "@playwright/test";

export async function seedPlaygroundStorage(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("nsr_tour_seen", "true");
    localStorage.setItem("nsr_subscription_plan", "pro");
    localStorage.setItem("nsr_playground_sidebar_collapsed", "false");

    const win = window as Window & {
      __nsrJsonExportClicked?: boolean;
      __NSR_E2E_STUB_PDF__?: boolean;
    };
    win.__nsrJsonExportClicked = false;
    win.__NSR_E2E_STUB_PDF__ = true;
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function anchorClick() {
      if (this.getAttribute("download") === "data.json") {
        win.__nsrJsonExportClicked = true;
      }
      return originalClick.call(this);
    };
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
  const option = page.locator(`#${optionId}`);
  await expect(option).toBeVisible();
  await option.click();
}
