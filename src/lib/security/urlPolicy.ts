export type UrlPolicyResult = { ok: true; url: URL } | { ok: false; error: string };

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /\.local$/i,
  /\.internal$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^::1$/i,
  /^\[::1\]$/,
  /^fc[0-9a-f:]+$/i,
  /^fd[0-9a-f:]+$/i,
  /^fe8[0-9a-f:]*$/i,
  /^fe9[0-9a-f:]*$/i,
  /^fea[0-9a-f:]*$/i,
  /^feb[0-9a-f:]*$/i,
];

export function parsePublicHttpUrl(raw: string): UrlPolicyResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "URL is required" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: "Invalid URL" };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { ok: false, error: "Only http/https URLs are allowed" };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, error: "URLs with embedded credentials are not allowed" };
  }

  const host = parsed.hostname.toLowerCase();
  if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(host))) {
    return { ok: false, error: "Private or local URLs are not allowed" };
  }

  return { ok: true, url: parsed };
}

/** JobsDB start URLs must be HTTPS and on an official jobsdb.com host. */
export function validateJobsdbStartUrl(raw: string, country: "hk" | "th"): UrlPolicyResult {
  const base = parsePublicHttpUrl(raw);
  if (!base.ok) return base;

  if (base.url.protocol !== "https:") {
    return { ok: false, error: "JobsDB URLs must use HTTPS" };
  }

  const host = base.url.hostname.toLowerCase();
  const countryHosts = new Set([
    `${country}.jobsdb.com`,
    `www.${country}.jobsdb.com`,
  ]);

  if (!countryHosts.has(host)) {
    return { ok: false, error: "startUrl must match the selected JobsDB country" };
  }

  return base;
}
