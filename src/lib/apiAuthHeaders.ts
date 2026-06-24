let accessTokenGetter: (() => string | null) | null = null;

export function setAccessTokenGetter(getter: (() => string | null) | null): void {
  accessTokenGetter = getter;
}

export function getAccessToken(): string | null {
  return accessTokenGetter?.() ?? null;
}

export function withApiAuthHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}
