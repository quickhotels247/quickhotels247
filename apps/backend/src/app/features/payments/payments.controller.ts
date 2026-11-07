import { BadRequestException, Body, Controller, Headers, HttpCode, HttpStatus, Logger, Post, Req } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { LIMITS } from "../../common/throttle/limits.js";
import { ConfirmPaymentDto } from "./dto/confirm-payment.dto.js";
import { PaymentsRepository } from "./payments.repository.js";
import { PaymentsService } from "./payments.service.js";
import { RazorpayClient, type RazorpayPayment } from "./razorpay/razorpay.client.js";

interface RazorpayWebhook {
  event?: string;
  payload?: { payment?: { entity?: RazorpayPayment } };
}

@Controller("v1/payments/razorpay")
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly payments: PaymentsService,
    private readonly repository: PaymentsRepository,
    private readonly razorpay: RazorpayClient,
  ) {}

  // From the browser after Razorpay Checkout succeeds.
  @Post("confirm")
  @HttpCode(HttpStatus.OK)
  @Throttle(LIMITS.sensitive)
  confirm(@Body() dto: ConfirmPaymentDto) {
    return this.payments.confirmFromCheckout(dto.orderId, dto.paymentId, dto.signature);
  }

  // Razorpay → us (payment.captured / authorized / failed, order.paid). Set it
  // up in the Razorpay dashboard with RAZORPAY_WEBHOOK_SECRET.
  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  async webhook(@Req() request: Request & { rawBody?: Buffer }, @Headers("x-razorpay-signature") signature?: string, @Headers("x-razorpay-event-id") eventId?: string) {
    const raw = request.rawBody;
    const valid = Boolean(raw) && this.razorpay.webhookSignatureValid(raw!, signature);
    const body = request.body as RazorpayWebhook;
    const event = body.event ?? "unknown";
    const entity = body.payload?.payment?.entity ?? null;
    // Kept without card or contact details.
    const redacted = { event, payment: entity ? { id: entity.id, order_id: entity.order_id, amount: entity.amount, currency: entity.currency, status: entity.status, method: entity.method } : null };
    const id = eventId || `${event}:${entity?.id ?? "none"}`;
    const fresh = await this.repository.recordWebhook(id, event, valid, redacted);
    if (!valid) {
      this.logger.warn(`Razorpay webhook ${event} with a bad signature ignored.`);
      throw new BadRequestException("Invalid signature.");
    }
    if (!fresh) return { ok: true }; // already handled
    await this.payments.handleWebhook(id, event, entity);
    return { ok: true };
  }
}
