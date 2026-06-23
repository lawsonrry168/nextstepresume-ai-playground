import { expect, type Page } from "@playwright/test";

export async function seedPlaygroundStorage(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("nsr_tour_seen", "true");
    localStorage.setItem("nsr_subscription_plan", "pro");
    localStorage.setItem("nsr_playground_sidebar_collapsed", "false");
    localStorage.setItem("nsr_ui_locale", "en");

    const win = window as Window & {
      __NSR_E2E_TRACK_EXPORTS__?: boolean;
      __NSR_E2E_STUB_PDF__?: boolean;
      __NSR_E2E_STUB_DOCX__?: boolean;
      __NSR_E2E_JSON_EXPORTED__?: boolean;
      __NSR_E2E_PDF_EXPORTED__?: boolean;
      __NSR_E2E_ATS_PDF_EXPORTED__?: boolean;
      __NSR_E2E_DOCX_EXPORTED__?: boolean;
    };
    win.__NSR_E2E_TRACK_EXPORTS__ = true;
    win.__NSR_E2E_STUB_PDF__ = true;
    win.__NSR_E2E_STUB_DOCX__ = true;
    win.__NSR_E2E_JSON_EXPORTED__ = false;
    win.__NSR_E2E_PDF_EXPORTED__ = false;
    win.__NSR_E2E_ATS_PDF_EXPORTED__ = false;
    win.__NSR_E2E_DOCX_EXPORTED__ = false;
  });
}

export async function gotoSimulator(page: Page) {
  await page.goto("/");
  await expect(page.locator("#screen-simulator")).toBeVisible();
  await expect(page.locator("#preview-col")).toBeVisible();
}

export async function gotoStudio(page: Page) {
  await gotoSimulator(page);
  await page.locator("#workspace-btn-preview-mode").click();
  await expect(page.locator("#immersive-preview-studio")).toBeVisible();
  await expect(page.locator("#canvas-studio-viewport")).toBeVisible();
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

export async function clickStudioExportOption(page: Page, optionId: string) {
  await page.locator("#studio-btn-export-menu").click();
  const option = page.locator(`#${optionId}`);
  await expect(option).toBeVisible();
  await option.click();
}

export type E2eExportFlags = {
  __NSR_E2E_JSON_EXPORTED__?: boolean;
  __NSR_E2E_PDF_EXPORTED__?: boolean;
  __NSR_E2E_ATS_PDF_EXPORTED__?: boolean;
  __NSR_E2E_DOCX_EXPORTED__?: boolean;
};

export async function readE2eExportFlags(page: Page): Promise<E2eExportFlags> {
  return page.evaluate(() => {
    const win = window as Window & E2eExportFlags;
    return {
      __NSR_E2E_JSON_EXPORTED__: win.__NSR_E2E_JSON_EXPORTED__ === true,
      __NSR_E2E_PDF_EXPORTED__: win.__NSR_E2E_PDF_EXPORTED__ === true,
      __NSR_E2E_ATS_PDF_EXPORTED__: win.__NSR_E2E_ATS_PDF_EXPORTED__ === true,
      __NSR_E2E_DOCX_EXPORTED__: win.__NSR_E2E_DOCX_EXPORTED__ === true,
    };
  });
}
