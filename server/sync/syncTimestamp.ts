export function parseIsoTimestamp(value: string | undefined | null): number {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

export function shouldApplyRemoteSnapshot(
  remoteUpdatedAt: string,
  localUpdatedAt: string | null | undefined,
): boolean {
  const remoteMs = parseIsoTimestamp(remoteUpdatedAt);
  const localMs = parseIsoTimestamp(localUpdatedAt);
  if (remoteMs === 0) return false;
  if (localMs === 0) return true;
  return remoteMs >= localMs;
}

export function shouldPushLocalSnapshot(
  localUpdatedAt: string | null | undefined,
  remoteUpdatedAt: string | null | undefined,
): boolean {
  const localMs = parseIsoTimestamp(localUpdatedAt);
  const remoteMs = parseIsoTimestamp(remoteUpdatedAt);
  if (localMs === 0) return true;
  if (remoteMs === 0) return true;
  return localMs > remoteMs;
}
