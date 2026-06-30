import { describe, expect, it } from "vitest";
import { isPrivateIpAddress } from "../../server/lib/outboundUrlSafety";

describe("outboundUrlSafety", () => {
  it("detects private IPv4 addresses", () => {
    expect(isPrivateIpAddress("127.0.0.1")).toBe(true);
    expect(isPrivateIpAddress("10.0.10.5")).toBe(true);
    expect(isPrivateIpAddress("172.20.1.8")).toBe(true);
    expect(isPrivateIpAddress("192.168.1.12")).toBe(true);
    expect(isPrivateIpAddress("169.254.10.20")).toBe(true);
  });

  it("detects private IPv6 addresses", () => {
    expect(isPrivateIpAddress("::1")).toBe(true);
    expect(isPrivateIpAddress("fc00::1234")).toBe(true);
    expect(isPrivateIpAddress("fd12:3456:789a::1")).toBe(true);
    expect(isPrivateIpAddress("fe80::abcd")).toBe(true);
  });

  it("allows public IP addresses", () => {
    expect(isPrivateIpAddress("8.8.8.8")).toBe(false);
    expect(isPrivateIpAddress("1.1.1.1")).toBe(false);
    expect(isPrivateIpAddress("2606:4700:4700::1111")).toBe(false);
  });
});
