import { NSR_STORAGE_KEYS } from "../storageKeys";

const CLIENT_ID_RE = /^[a-zA-Z0-9-]{8,64}$/;

function generateClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `nsr-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getOrCreateClientId(): string {
  if (typeof localStorage === "undefined") return generateClientId();
  try {
    const existing = localStorage.getItem(NSR_STORAGE_KEYS.clientId);
    if (existing && CLIENT_ID_RE.test(existing)) return existing;
    const next = generateClientId();
    localStorage.setItem(NSR_STORAGE_KEYS.clientId, next);
    return next;
  } catch {
    return generateClientId();
  }
}

export function isValidClientId(value: string | undefined): boolean {
  return Boolean(value && CLIENT_ID_RE.test(value));
}
