import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { PaymentsRepository } from "./payments.repository.js";
import { PaymentsService } from "./payments.service.js";
import { RazorpayClient, type RazorpayPayment } from "./razorpay/razorpay.client.js";

const sign = (order: string, payment: string) => createHmac("sha256", "secret").update(`${order}|${payment}`).digest("hex");

function setup(remote: Partial<RazorpayPayment> = {}) {
  const row = { id: "p1", providerOrderId: "order_A1B2C3", amount: 5864.5, currency: "INR", status: "CREATED", flightCheckoutId: "fc1", attemptId: null };
  let captured = false;
  const repo = {
    findByOrderId: vi.fn(async () => row),
    markCaptured: vi.fn(async () => (captured ? false : (captured = true))),
    markFailed: vi.fn(),
    markWebhookProcessed: vi.fn(),
  };
  const razorpay = new RazorpayClient({ keyId: "rzp_test_x", keySecret: "secret", webhookSecret: "hook" });
  const payment: RazorpayPayment = { id: "pay_X1Y2Z3", order_id: "order_A1B2C3", amount: 586450, currency: "INR", status: "captured", method: "upi", ...remote };
  vi.spyOn(razorpay, "fetchPayment").mockResolvedValue(payment);
  const capture = vi.spyOn(razorpay, "capture").mockResolvedValue({ ...payment, status: "captured" });
  const service = new PaymentsService(razorpay, repo as unknown as PaymentsRepository);
  const fulfil = vi.fn(async () => {});
  service.registerFulfiller("flight", fulfil);
  return { service, repo, fulfil, capture };
}

describe("PaymentsService", () => {
  it("confirms a signed payment once and starts the booking", async () => {
    const { service, fulfil } = setup();
    expect(await service.confirmFromCheckout("order_A1B2C3", "pay_X1Y2Z3", sign("order_A1B2C3", "pay_X1Y2Z3"))).toEqual({ kind: "flight", id: "fc1" });
    // The webhook for the same payment arrives too: no second booking.
    await service.handleWebhook("evt_1", "payment.captured", { id: "pay_X1Y2Z3", order_id: "order_A1B2C3" } as RazorpayPayment);
    expect(fulfil).toHaveBeenCalledTimes(1);
    expect(fulfil).toHaveBeenCalledWith("fc1");
  });

  it("rejects a bad signature without booking", async () => {
    const { service, fulfil } = setup();
    await expect(service.confirmFromCheckout("order_A1B2C3", "pay_X1Y2Z3", "0".repeat(64))).rejects.toThrow(/couldn't verify/);
    expect(fulfil).not.toHaveBeenCalled();
  });

  it("refuses a payment for a different amount", async () => {
    const { service, fulfil } = setup({ amount: 100 });
    await expect(service.confirmFromCheckout("order_A1B2C3", "pay_X1Y2Z3", sign("order_A1B2C3", "pay_X1Y2Z3"))).rejects.toThrow(/doesn't match/);
    expect(fulfil).not.toHaveBeenCalled();
  });

  it("captures an authorised payment before booking", async () => {
    const { service, capture, fulfil } = setup({ status: "authorized" });
    await service.confirmFromCheckout("order_A1B2C3", "pay_X1Y2Z3", sign("order_A1B2C3", "pay_X1Y2Z3"));
    expect(capture).toHaveBeenCalledWith("pay_X1Y2Z3", 586450, "INR");
    expect(fulfil).toHaveBeenCalled();
  });
});
