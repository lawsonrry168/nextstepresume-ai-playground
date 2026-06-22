import type { AppLocale, MessageTree } from "./types";
import { DEFAULT_LOCALE } from "./types";
import { deepMergeMessages } from "../lib/market/deepMerge";
import zhTW from "./locales/zh-TW";

const MESSAGES: Partial<Record<AppLocale, MessageTree>> = {};

const localeLoadPromises = new Map<AppLocale, Promise<void>>();

async function importLocaleMessages(locale: AppLocale): Promise<MessageTree> {
  if (locale === "en") {
    const mod = await import("./locales/en");
    const hk = await import("./locales/en-HK-overrides");
    return deepMergeMessages(mod.default, hk.default);
  }
  if (locale === "zh-HK") {
    const hk = await import("./locales/zh-HK");
    return deepMergeMessages(zhTW, hk.default);
  }
  return zhTW;
}

export async function ensureLocaleLoaded(locale: AppLocale): Promise<void> {
  if (MESSAGES[locale]) return;
  let pending = localeLoadPromises.get(locale);
  if (!pending) {
    pending = importLocaleMessages(locale).then((messages) => {
      MESSAGES[locale] = messages;
    });
    localeLoadPromises.set(locale, pending);
  }
  await pending;
}

export function isLocaleLoaded(locale: AppLocale): boolean {
  return Boolean(MESSAGES[locale]);
}

let activeLocale: AppLocale = DEFAULT_LOCALE;

export function setActiveLocale(locale: AppLocale): void {
  activeLocale = locale;
}

export function getActiveLocale(): AppLocale {
  return activeLocale;
}

function resolvePath(tree: MessageTree, path: string): string | undefined {
  const parts = path.split(".");
  let node: string | MessageTree | undefined = tree;
  for (const part of parts) {
    if (node == null || typeof node === "string") return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = vars[key];
    return value === undefined ? `{{${key}}}` : String(value);
  });
}

export function translate(
  key: string,
  vars?: Record<string, string | number>,
  locale: AppLocale = activeLocale,
): string {
  const tree = MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];
  const primary = tree ? resolvePath(tree, key) : undefined;
  if (primary) return interpolate(primary, vars);
  if (locale !== DEFAULT_LOCALE) {
    const fallbackTree = MESSAGES[DEFAULT_LOCALE];
    const fallback = fallbackTree ? resolvePath(fallbackTree, key) : undefined;
    if (fallback) return interpolate(fallback, vars);
  }
  return key;
}

export function t(
  key: string,
  vars?: Record<string, string | number>,
  locale?: AppLocale,
): string {
  return translate(key, vars, locale);
}
