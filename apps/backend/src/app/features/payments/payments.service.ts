import { BadRequestException, ConflictException, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import type { ConfirmPaymentResponse, PaymentOrder } from "@quickhotels/types/payments";
import { frontendUrlFromEnv } from "../auth/auth.config.js";
import { supportInbox } from "../../mail/inbox.js";
import { MailService } from "../../mail/mail.service.js";
import { opsAlertEmail } from "../../mail/templates/ops-alert.template.js";
import { RazorpayClient, RazorpayError, type RazorpayPayment } from "./razorpay/razorpay.client.js";
import { PaymentsRepository, type PaymentTarget, type StoredPayment } from "./payments.repository.js";

export interface OrderRequest {
  target: PaymentTarget;
  amount: number; // rupees
  currency: string;
  description: string;
  prefill: PaymentOrder["prefill"];
}

// Runs after a payment is captured (once per payment): books with the supplier.
export type Fulfiller = (id: string) => Promise<void>;

const paise = (amount: number) => Math.round(amount * 100);
const kindOf = (payment: StoredPayment): ConfirmPaymentResponse | null =>
  payment.flightCheckoutId ? { kind: "flight", id: payment.flightCheckoutId } : payment.attemptId ? { kind: "hotel", id: payment.attemptId } : null;

// Razorpay payments: orders for what's payable, confirming a payment (from
// Checkout or the webhook, whichever comes first, once), and refunds.
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly fulfillers = new Map<ConfirmPaymentResponse["kind"], Fulfiller>();

  constructor(
    private readonly razorpay: RazorpayClient,
    private readonly payments: PaymentsRepository,
    private readonly mail: MailService,
  ) {}

  // Tells the team (support inbox) about a payment problem.
  alert(subject: string, lines: string[], action?: string) {
    const inbox = supportInbox();
    this.logger.error(`${subject}: ${lines.join(" | ")}`);
    if (inbox) this.mail.sendInBackground(opsAlertEmail(inbox, { subject, lines, action, link: `${frontendUrlFromEnv()}/admin` }), { template: "ops-alert" });
  }

  // The captured payment for a booking (id and amount), if any.
  captured(target: PaymentTarget) {
    return this.payments.findCaptured(target);
  }

  // Unpaid orders whose payment report never arrived (browser closed, webhook
  // missing): ask Razorpay and settle any that were paid. Run by the reconciler.
  async reconcileOpenOrders(): Promise<number> {
    let settled = 0;
    for (const payment of await this.payments.ordersToCheck()) {
      try {
        const { items } = await this.razorpay.orderPayments(payment.providerOrderId);
        const paid = items.find((item) => item.status === "captured" || item.status === "authorized");
        if (!paid) continue;
        this.logger.warn(`Order ${payment.providerOrderId} was paid but never confirmed; settling now.`);
        await this.settle(payment, paid);
        settled++;
      } catch (error) {
        this.logger.warn(`Checking order ${payment.providerOrderId} failed: ${(error as Error).message}`);
      }
    }
    return settled;
  }

  // Flights / hotels register what to do once a payment is captured.
  registerFulfiller(kind: ConfirmPaymentResponse["kind"], fulfil: Fulfiller) {
    this.fulfillers.set(kind, fulfil);
  }

  async createOrder(request: OrderRequest): Promise<PaymentOrder> {
    if (!this.razorpay.configured || !this.razorpay.keyId) throw new ServiceUnavailableException("Online payment isn't set up yet.");
    if (request.amount <= 0) throw new BadRequestException("There's nothing to pay.");
    const already = await this.payments.findCaptured(request.target);
    if (already) throw new ConflictException("This booking is already paid.");
    let payment = await this.payments.findOpenOrder(request.target, request.amount);
    if (!payment) {
      const receipt = (request.target.flightCheckoutId ?? request.target.attemptId ?? "").replace(/-/g, "").slice(0, 32);
      const order = await this.razorpay.createOrder(paise(request.amount), request.currency, receipt, {
        ...(request.target.flightCheckoutId ? { flightCheckoutId: request.target.flightCheckoutId } : {}),
        ...(request.target.attemptId ? { checkoutId: request.target.attemptId } : {}),
      }).catch((error: unknown) => {
        if (error instanceof RazorpayError) throw new ServiceUnavailableException("We couldn't start the payment. Please try again in a moment.");
        throw error;
      });
      payment = await this.payments.create(request.target, order.id, request.amount, request.currency);
    }
    return {
      provider: "razorpay",
      orderId: payment.providerOrderId,
      keyId: this.razorpay.keyId,
      amount: paise(Number(payment.amount)),
      currency: payment.currency,
      name: "QuickHotels24/7",
      description: request.description,
      prefill: request.prefill,
    };
  }

  // Razorpay Checkout's success handler (via the browser): trust it only
  // after checking the signature and reading the payment from Razorpay.
  async confirmFromCheckout(orderId: string, paymentId: string, signature: string): Promise<ConfirmPaymentResponse> {
    const payment = await this.payments.findByOrderId(orderId);
    if (!payment || !this.razorpay.checkoutSignatureValid(orderId, paymentId, signature)) {
      throw new BadRequestException("We couldn't verify this payment. If money was taken, it will be refunded automatically; contact us with the payment ID.");
    }
    await this.settle(payment, await this.razorpay.fetchPayment(paymentId));
    return kindOf(payment)!;
  }

  // POST /api/v1/payments/razorpay/webhook (signature checked by the caller).
  async handleWebhook(eventId: string, event: string, entity: RazorpayPayment | null): Promise<void> {
    if (!entity?.order_id) return;
    const payment = await this.payments.findByOrderId(entity.order_id);
    if (!payment) return;
    if (event === "payment.failed") return this.payments.markFailed(entity.order_id);
    if (event === "payment.captured" || event === "payment.authorized" || event === "order.paid") {
      // Read it from Razorpay rather than trusting the event body's status.
      await this.settle(payment, await this.razorpay.fetchPayment(entity.id));
    }
    await this.payments.markWebhookProcessed(eventId);
  }

  // Checks amount and order, captures if only authorised, records it once,
  // then hands over to the booking's fulfiller.
  private async settle(payment: StoredPayment, remote: RazorpayPayment): Promise<void> {
    if (remote.order_id !== payment.providerOrderId) throw new BadRequestException("This payment belongs to another order.");
    if (remote.amount !== paise(Number(payment.amount)) || remote.currency !== payment.currency) {
      this.alert("Payment amount mismatch", [
        `Razorpay payment ${remote.id} is ${remote.amount / 100} ${remote.currency}, but order ${payment.providerOrderId} expects ${Number(payment.amount)} ${payment.currency}.`,
      ], "Check the payment in Razorpay and refund it if needed; nothing was booked.");
      throw new BadRequestException("The amount paid doesn't match this booking. Please contact us.");
    }
    let status = remote.status;
    if (status === "authorized") status = (await this.razorpay.capture(remote.id, remote.amount, remote.currency)).status;
    if (status !== "captured") throw new BadRequestException("The payment hasn't gone through yet. If money was taken, it will be refunded automatically.");
    const first = await this.payments.markCaptured(payment.id, remote.id, remote.method);
    if (!first) return; // Checkout and the webhook both arrive; only the first books.
    const target = kindOf(payment);
    const fulfil = target && this.fulfillers.get(target.kind);
    if (!target || !fulfil) {
      this.alert("Payment captured with nothing to book", [`Razorpay payment ${remote.id} (order ${payment.providerOrderId}) has no booking to fulfil.`], "Refund it from the Razorpay dashboard.");
      return;
    }
    // Booking takes a while; it continues after the customer's request returns.
    void fulfil(target.id).catch((error: Error) => this.logger.error(`Fulfilling ${target.kind} ${target.id} failed: ${error.message}`));
  }

  // Refunds the captured payment for this booking in full (supplier couldn't
  // book). Recorded either way; a failed refund alerts the team.
  async refundAll(target: PaymentTarget, reason: string): Promise<{ status: "pending" | "processed" | "failed"; amount: number; currency: string } | null> {
    try {
      return await this.refund(target, null, reason, null);
    } catch (error) {
      if (error instanceof BadRequestException) return null; // nothing left to refund
      throw error;
    }
  }

  // Refunds `amount` (rupees; null = everything still refundable) of this
  // booking's captured payment. Staff refunds carry the admin's id.
  async refund(
    target: PaymentTarget,
    amount: number | null,
    reason: string,
    adminId: string | null,
    cancellationId: string | null = null,
  ): Promise<{ status: "pending" | "processed" | "failed"; amount: number; currency: string }> {
    const payment = await this.payments.findCaptured(target);
    if (!payment?.providerPaymentId) throw new BadRequestException("There's no captured payment to refund.");
    const paid = Number(payment.amount);
    const refunded = payment.refunds.filter((item) => item.status !== "FAILED").reduce((sum, item) => sum + Number(item.amount), 0);
    const remaining = Math.round((paid - refunded) * 100) / 100;
    const value = amount ?? remaining;
    if (value <= 0 || remaining <= 0) throw new BadRequestException("This payment is already fully refunded.");
    if (value > remaining) throw new BadRequestException(`You can refund at most ${remaining} ${payment.currency}.`);
    const full = Math.round((refunded + value) * 100) >= Math.round(paid * 100);
    try {
      const result = await this.razorpay.refund(payment.providerPaymentId, paise(value), { reason: reason.slice(0, 200) });
      const processed = result.status === "processed";
      await this.payments.saveRefund(payment.id, { providerRefundId: result.id, amount: value, currency: payment.currency, status: processed ? "COMPLETED" : "PENDING", reason, adminId, full, cancellationId });
      return { status: processed ? "processed" : "pending", amount: value, currency: payment.currency };
    } catch (error) {
      this.alert("Refund failed", [`Refunding ${value} ${payment.currency} for Razorpay payment ${payment.providerPaymentId} failed: ${(error as Error).message}`, `Reason for the refund: ${reason}`], "Refund it from the Razorpay dashboard, then tell the customer.");
      await this.payments.saveRefund(payment.id, { providerRefundId: null, amount: value, currency: payment.currency, status: "FAILED", reason, adminId, full, cancellationId });
      return { status: "failed", amount: value, currency: payment.currency };
    }
  }
}
