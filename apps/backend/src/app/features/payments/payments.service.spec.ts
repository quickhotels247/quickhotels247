import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { MailService } from "../../mail/mail.service.js";
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
    ordersToCheck: vi.fn(async () => [row]),
  };
  const mail = { sendInBackground: vi.fn() };
  const razorpay = new RazorpayClient({ keyId: "rzp_test_x", keySecret: "secret", webhookSecret: "hook" });
  const payment: RazorpayPayment = { id: "pay_X1Y2Z3", order_id: "order_A1B2C3", amount: 586450, currency: "INR", status: "captured", method: "upi", ...remote };
  vi.spyOn(razorpay, "fetchPayment").mockResolvedValue(payment);
  const capture = vi.spyOn(razorpay, "capture").mockResolvedValue({ ...payment, status: "captured" });
  const service = new PaymentsService(razorpay, repo as unknown as PaymentsRepository, mail as unknown as MailService);
  const orderPayments = vi.spyOn(razorpay, "orderPayments").mockResolvedValue({ items: [payment] });
  const fulfil = vi.fn(async () => {});
  service.registerFulfiller("flight", fulfil);
  return { service, repo, fulfil, capture, mail, orderPayments };
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

  it("refuses a payment for a different amount and alerts the team", async () => {
    vi.stubEnv("SUPPORT_EMAIL", "team@example.com");
    const { service, fulfil, mail } = setup({ amount: 100 });
    await expect(service.confirmFromCheckout("order_A1B2C3", "pay_X1Y2Z3", sign("order_A1B2C3", "pay_X1Y2Z3"))).rejects.toThrow(/doesn't match/);
    expect(fulfil).not.toHaveBeenCalled();
    expect(mail.sendInBackground).toHaveBeenCalledWith(expect.objectContaining({ to: "team@example.com", subject: expect.stringContaining("mismatch") }), expect.anything());
    vi.unstubAllEnvs();
  });

  it("finds a paid order whose confirmation never arrived", async () => {
    const { service, fulfil } = setup();
    expect(await service.reconcileOpenOrders()).toBe(1);
    expect(fulfil).toHaveBeenCalledWith("fc1");
  });

  it("leaves unpaid orders alone", async () => {
    const { service, fulfil, orderPayments } = setup();
    orderPayments.mockResolvedValue({ items: [] });
    expect(await service.reconcileOpenOrders()).toBe(0);
    expect(fulfil).not.toHaveBeenCalled();
  });

  it("captures an authorised payment before booking", async () => {
    const { service, capture, fulfil } = setup({ status: "authorized" });
    await service.confirmFromCheckout("order_A1B2C3", "pay_X1Y2Z3", sign("order_A1B2C3", "pay_X1Y2Z3"));
    expect(capture).toHaveBeenCalledWith("pay_X1Y2Z3", 586450, "INR");
    expect(fulfil).toHaveBeenCalled();
  });
});

describe("PaymentsService.refund", () => {
  function refundSetup(refunds: { amount: number; status: string }[] = []) {
    const payment = { id: "p1", providerPaymentId: "pay_X1Y2Z3", amount: 6000, currency: "INR", refunds };
    const repo = { findCaptured: vi.fn(async () => payment), saveRefund: vi.fn(async () => {}) };
    const razorpay = new RazorpayClient({ keyId: "rzp_test_x", keySecret: "secret", webhookSecret: "hook" });
    const call = vi.spyOn(razorpay, "refund").mockResolvedValue({ id: "rfnd_1", amount: 0, status: "processed" });
    const service = new PaymentsService(razorpay, repo as unknown as PaymentsRepository, { sendInBackground: vi.fn() } as unknown as MailService);
    return { service, repo, call };
  }

  it("refunds part, then the rest, and records who did it", async () => {
    const { service, repo, call } = refundSetup();
    await service.refund({ flightCheckoutId: "fc1" }, 1500, "Seat downgrade", "admin-1");
    expect(call).toHaveBeenCalledWith("pay_X1Y2Z3", 150000, { reason: "Seat downgrade" });
    expect(repo.saveRefund).toHaveBeenCalledWith("p1", expect.objectContaining({ amount: 1500, adminId: "admin-1", full: false, status: "COMPLETED" }));
  });

  it("refunds everything left when no amount is given", async () => {
    const { service, repo } = refundSetup([{ amount: 1500, status: "COMPLETED" }]);
    const result = await service.refund({ flightCheckoutId: "fc1" }, null, "Cancelled", "admin-1");
    expect(result.amount).toBe(4500);
    expect(repo.saveRefund).toHaveBeenCalledWith("p1", expect.objectContaining({ amount: 4500, full: true }));
  });

  it("won't refund more than is left, and ignores failed refunds when counting", async () => {
    const { service, call } = refundSetup([{ amount: 5000, status: "COMPLETED" }, { amount: 1000, status: "FAILED" }]);
    await expect(service.refund({ flightCheckoutId: "fc1" }, 1500, "Too much", "admin-1")).rejects.toThrow(/at most 1000/);
    expect(call).not.toHaveBeenCalled();
  });
});
