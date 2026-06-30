import { describe, expect, it } from "vitest";
import { shouldDowngradeAfterInvoicePaymentFailed } from "../../server/routes/billing";

describe("shouldDowngradeAfterInvoicePaymentFailed", () => {
  it("does not downgrade active retrying subscriptions", () => {
    expect(shouldDowngradeAfterInvoicePaymentFailed("active")).toBe(false);
    expect(shouldDowngradeAfterInvoicePaymentFailed("past_due")).toBe(false);
    expect(shouldDowngradeAfterInvoicePaymentFailed("trialing")).toBe(false);
  });

  it("downgrades terminal subscription states", () => {
    expect(shouldDowngradeAfterInvoicePaymentFailed("unpaid")).toBe(true);
    expect(shouldDowngradeAfterInvoicePaymentFailed("canceled")).toBe(true);
    expect(shouldDowngradeAfterInvoicePaymentFailed("incomplete_expired")).toBe(true);
  });
});
