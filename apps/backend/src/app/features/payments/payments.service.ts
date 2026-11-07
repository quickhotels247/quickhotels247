import { BadRequestException, ConflictException, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import type { ConfirmPaymentResponse, PaymentOrder } from "@quickhotels/types/payments";
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
  ) {}

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
      this.logger.error(`Payment ${remote.id} amount ${remote.amount} ${remote.currency} doesn't match order ${payment.providerOrderId}.`);
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
      this.logger.error(`Payment ${remote.id} captured with nothing to fulfil.`);
      return;
    }
    // Booking takes a while; it continues after the customer's request returns.
    void fulfil(target.id).catch((error: Error) => this.logger.error(`Fulfilling ${target.kind} ${target.id} failed: ${error.message}`));
  }

  // Refunds the captured payment for this booking in full (supplier couldn't
  // book). Recorded either way; a failed refund shows up for staff.
  async refundAll(target: PaymentTarget, reason: string): Promise<{ status: "pending" | "processed" | "failed"; amount: number; currency: string } | null> {
    const payment = await this.payments.findCaptured(target);
    if (!payment?.providerPaymentId) return null;
    if (payment.status === "REFUNDED") return { status: "pending", amount: Number(payment.amount), currency: payment.currency };
    const amount = Number(payment.amount);
    try {
      const refund = await this.razorpay.refund(payment.providerPaymentId, paise(amount), { reason: reason.slice(0, 200) });
      const processed = refund.status === "processed";
      await this.payments.saveRefund(payment.id, { providerRefundId: refund.id, amount, currency: payment.currency, status: processed ? "COMPLETED" : "PENDING", reason });
      return { status: processed ? "processed" : "pending", amount, currency: payment.currency };
    } catch (error) {
      this.logger.error(`Refund for payment ${payment.providerPaymentId} failed: ${(error as Error).message}`);
      await this.payments.saveRefund(payment.id, { providerRefundId: null, amount, currency: payment.currency, status: "FAILED", reason });
      return { status: "failed", amount, currency: payment.currency };
    }
  }
}
