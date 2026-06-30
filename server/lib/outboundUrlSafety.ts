import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  if (a === 10 || a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true;
  if (a === 0) return true;
  return false;
}

function expandIpv6(address: string): string[] | null {
  const normalized = address.toLowerCase().split("%")[0];
  if (!normalized.includes(":")) return null;

  const halves = normalized.split("::");
  if (halves.length > 2) return null;

  const left = halves[0] ? halves[0].split(":").filter(Boolean) : [];
  const right = halves[1] ? halves[1].split(":").filter(Boolean) : [];
  if (left.length + right.length > 8) return null;

  const fill = new Array(8 - left.length - right.length).fill("0");
  const groups = halves.length === 2 ? [...left, ...fill, ...right] : left;
  if (groups.length !== 8) return null;
  return groups.map((group) => group.padStart(4, "0"));
}

function isPrivateIpv6(address: string): boolean {
  const groups = expandIpv6(address);
  if (!groups) return false;

  const first = parseInt(groups[0]!, 16);
  const second = parseInt(groups[1]!, 16);

  if (first === 0 && second === 0 && groups.slice(2, 7).every((group) => parseInt(group, 16) === 0)) {
    const last = parseInt(groups[7]!, 16);
    if (last === 0 || last === 1) return true;
  }

  if ((first & 0xfe00) === 0xfc00) return true;
  if ((first & 0xffc0) === 0xfe80) return true;
  return false;
}

export function isPrivateIpAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version === 6) return isPrivateIpv6(address);
  return false;
}

export async function assertSafeOutboundUrl(url: URL): Promise<void> {
  const resolved = await lookup(url.hostname, { all: true, verbatim: true });
  if (resolved.length === 0) {
    throw new Error("Unable to resolve remote host");
  }

  const blocked = resolved.find((entry) => isPrivateIpAddress(entry.address));
  if (blocked) {
    throw new Error("Private or local URLs are not allowed");
  }
}
