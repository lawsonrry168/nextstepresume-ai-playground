type E2eExportWindow = Window & {
  __NSR_E2E_TRACK_EXPORTS__?: boolean;
  __NSR_E2E_STUB_PDF__?: boolean;
  __NSR_E2E_JSON_EXPORTED__?: boolean;
  __NSR_E2E_PDF_EXPORTED__?: boolean;
};

function e2eWindow(): E2eExportWindow | null {
  if (typeof window === "undefined") return null;
  return window as E2eExportWindow;
}

export function isE2eExportTrackingEnabled(): boolean {
  return e2eWindow()?.__NSR_E2E_TRACK_EXPORTS__ === true;
}

export function isE2ePdfStubEnabled(): boolean {
  return e2eWindow()?.__NSR_E2E_STUB_PDF__ === true;
}

export function markE2eJsonExportComplete(): void {
  const win = e2eWindow();
  if (!win?.__NSR_E2E_TRACK_EXPORTS__) return;
  win.__NSR_E2E_JSON_EXPORTED__ = true;
}

export function markE2ePdfExportComplete(): void {
  const win = e2eWindow();
  if (!win?.__NSR_E2E_TRACK_EXPORTS__) return;
  win.__NSR_E2E_PDF_EXPORTED__ = true;
}
