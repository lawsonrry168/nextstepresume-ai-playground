export type AppMode = "playground" | "production";

export function parseAppMode(raw?: string | null): AppMode {
  return raw === "production" ? "production" : "playground";
}

export function isProductionAppMode(mode: AppMode): boolean {
  return mode === "production";
}

export function readServerAppMode(): AppMode {
  return parseAppMode(process.env.NSR_APP_MODE);
}
