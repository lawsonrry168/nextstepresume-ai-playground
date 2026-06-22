export interface ApifyRunResult<T = unknown> {
  ok: boolean;
  status: number;
  payload: T;
  rawText: string;
}

/**
 * Run an Apify actor synchronously and return dataset items.
 * Token is sent via Authorization header (not query string).
 */
export async function runApifyActorSync<T = unknown>(options: {
  actorId: string;
  token: string;
  input: unknown;
  signal?: AbortSignal;
}): Promise<ApifyRunResult<T>> {
  const { actorId, token, input, signal } = options;
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
    signal,
  });

  const rawText = await response.text();
  let payload: T;
  try {
    payload = JSON.parse(rawText) as T;
  } catch {
    payload = rawText as T;
  }

  return {
    ok: response.ok,
    status: response.status,
    payload,
    rawText,
  };
}

export function extractApifyErrorMessage(payload: unknown, status: number): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as { error: unknown }).error === "object" &&
    (payload as { error: { message?: string } }).error?.message
  ) {
    return (payload as { error: { message: string } }).error.message;
  }
  return `Apify request failed (${status})`;
}
