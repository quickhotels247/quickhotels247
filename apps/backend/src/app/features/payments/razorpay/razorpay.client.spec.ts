import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { RazorpayClient } from "./razorpay.client.js";

const client = new RazorpayClient({ keyId: "rzp_test_x", keySecret: "secret", webhookSecret: "hook" });

describe("RazorpayClient signatures", () => {
  it("checks Checkout's order|payment signature", () => {
    const signature = createHmac("sha256", "secret").update("order_1|pay_1").digest("hex");
    expect(client.checkoutSignatureValid("order_1", "pay_1", signature)).toBe(true);
    expect(client.checkoutSignatureValid("order_1", "pay_2", signature)).toBe(false);
    expect(client.checkoutSignatureValid("order_1", "pay_1", "nope")).toBe(false);
  });

  it("checks webhook signatures on the raw body", () => {
    const body = Buffer.from('{"event":"payment.captured"}');
    const signature = createHmac("sha256", "hook").update(body).digest("hex");
    expect(client.webhookSignatureValid(body, signature)).toBe(true);
    expect(client.webhookSignatureValid(Buffer.from("{}"), signature)).toBe(false);
    expect(client.webhookSignatureValid(body, undefined)).toBe(false);
  });
});
