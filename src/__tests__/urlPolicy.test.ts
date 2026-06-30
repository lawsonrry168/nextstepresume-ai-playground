import { describe, expect, it } from "vitest";
import { parsePublicHttpUrl, validateJobsdbStartUrl } from "../lib/security/urlPolicy";

describe("urlPolicy", () => {
  it("blocks private network hosts", () => {
    expect(parsePublicHttpUrl("http://127.0.0.1/jd").ok).toBe(false);
    expect(parsePublicHttpUrl("http://localhost/jd").ok).toBe(false);
    expect(parsePublicHttpUrl("http://192.168.0.5/jd").ok).toBe(false);
    expect(parsePublicHttpUrl("http://[::1]/jd").ok).toBe(false);
    expect(parsePublicHttpUrl("https://internal.service.internal/jd").ok).toBe(false);
  });

  it("allows public https URLs", () => {
    const result = parsePublicHttpUrl("https://example.com/jobs/123");
    expect(result.ok).toBe(true);
  });

  it("rejects embedded credentials", () => {
    const result = parsePublicHttpUrl("https://user:pass@example.com/jobs/123");
    expect(result.ok).toBe(false);
  });

  it("accepts official JobsDB HK HTTPS search URLs", () => {
    const result = validateJobsdbStartUrl(
      "https://hk.jobsdb.com/software-engineer-jobs",
      "hk",
    );
    expect(result.ok).toBe(true);
  });

  it("rejects non-JobsDB start URLs", () => {
    const result = validateJobsdbStartUrl("https://evil.example.com/jobs", "hk");
    expect(result.ok).toBe(false);
  });

  it("rejects HTTP JobsDB URLs", () => {
    const result = validateJobsdbStartUrl("http://hk.jobsdb.com/jobs", "hk");
    expect(result.ok).toBe(false);
  });

  it("rejects country mismatch hosts", () => {
    const result = validateJobsdbStartUrl("https://th.jobsdb.com/jobs", "hk");
    expect(result.ok).toBe(false);
  });
});
