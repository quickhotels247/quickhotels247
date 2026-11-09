import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/database/prisma.service.js";
import { Prisma } from "../../../generated/prisma/client.js";

export interface PaymentTarget {
  flightCheckoutId?: string;
  attemptId?: string;
}

export type StoredPayment = Prisma.PaymentGetPayload<object>;

@Injectable()
export class PaymentsRepository {
  constructor(private readonly db: PrismaService) {}

  // An unpaid order for the same booking and amount, to reuse instead of
  // creating another (the customer closed Checkout and pressed Pay again).
  findOpenOrder(target: PaymentTarget, amount: number) {
    return this.db.payment.findFirst({ where: { ...target, amount, status: { in: ["CREATED", "FAILED"] } }, orderBy: { createdAt: "desc" } });
  }

  create(target: PaymentTarget, orderId: string, amount: number, currency: string) {
    return this.db.payment.create({ data: { ...target, providerOrderId: orderId, amount, currency } });
  }

  findByOrderId(orderId: string) {
    return this.db.payment.findUnique({ where: { providerOrderId: orderId } });
  }

  findCaptured(target: PaymentTarget) {
    return this.db.payment.findFirst({ where: { ...target, status: { in: ["CAPTURED", "REFUNDED", "PARTIALLY_REFUNDED"] } }, include: { refunds: true } });
  }

  // Unpaid orders from the last day, old enough that Checkout or the webhook
  // should have reported a payment: the reconciler asks Razorpay about them.
  ordersToCheck(limit = 20) {
    const now = Date.now();
    return this.db.payment.findMany({
      where: { status: { in: ["CREATED", "FAILED"] }, createdAt: { gte: new Date(now - 24 * 3600_000), lte: new Date(now - 3 * 60_000) } },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  }

  // True only for the call that moved it to CAPTURED (repeats are no-ops).
  async markCaptured(id: string, paymentId: string, method: string | null): Promise<boolean> {
    const { count } = await this.db.payment.updateMany({
      where: { id, status: { in: ["CREATED", "PENDING", "FAILED"] } },
      data: { status: "CAPTURED", providerPaymentId: paymentId, method },
    });
    return count > 0;
  }

  async markFailed(orderId: string): Promise<void> {
    await this.db.payment.updateMany({ where: { providerOrderId: orderId, status: { in: ["CREATED", "PENDING"] } }, data: { status: "FAILED" } });
  }

  // False when this webhook event was already received.
  async recordWebhook(eventId: string, eventType: string, signatureValid: boolean, payload: object): Promise<boolean> {
    try {
      await this.db.paymentWebhookEvent.create({ data: { providerEventId: eventId, eventType, signatureValid, payloadRedacted: payload as Prisma.InputJsonObject } });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return false;
      throw error;
    }
  }

  async markWebhookProcessed(eventId: string): Promise<void> {
    await this.db.paymentWebhookEvent.updateMany({ where: { providerEventId: eventId }, data: { processedAt: new Date() } });
  }

  // `full`: this refund brings the total refunded to the whole payment.
  async saveRefund(
    paymentId: string,
    refund: { providerRefundId: string | null; amount: number; currency: string; status: "PENDING" | "COMPLETED" | "FAILED"; reason: string; adminId?: string | null; full: boolean },
  ) {
    await this.db.$transaction([
      this.db.refund.create({
        data: {
          paymentId,
          providerRefundId: refund.providerRefundId,
          amount: refund.amount,
          currency: refund.currency,
          status: refund.status,
          reason: refund.reason,
          initiatedByAdminId: refund.adminId ?? null,
          ...(refund.status === "COMPLETED" ? { completedAt: new Date() } : {}),
        },
      }),
      ...(refund.status === "FAILED" ? [] : [this.db.payment.update({ where: { id: paymentId }, data: { status: refund.full ? "REFUNDED" : "PARTIALLY_REFUNDED" } })]),
    ]);
  }
}
