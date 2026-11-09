import { createHmac, timingSafeEqual } from "node:crypto";
import { Inject, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { razorpayConfig, type RazorpayConfig } from "./razorpay.config.js";

const API = "https://api.razorpay.com/v1";
const TIMEOUT_MS = 20_000;

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  // created | authorized | captured | refunded | failed
  status: string;
  method: string | null;
  error_description?: string | null;
}

export interface RazorpayRefund {
  id: string;
  amount: number;
  status: string; // pending | processed | failed
}

export class RazorpayError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const safeEqual = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

// Razorpay's REST API (orders, payments, refunds) and signature checks.
// The key secret stays on the server; the browser only gets the key id.
@Injectable()
export class RazorpayClient {
  private readonly logger = new Logger(RazorpayClient.name);

  constructor(@Inject(razorpayConfig.KEY) private readonly config: RazorpayConfig) {}

  get keyId() {
    return this.config.keyId;
  }

  get configured() {
    return Boolean(this.config.keyId && this.config.keySecret);
  }

  createOrder(amountPaise: number, currency: string, receipt: string, notes: Record<string, string>) {
    return this.call<RazorpayOrder>("POST", "/orders", { amount: amountPaise, currency, receipt, notes });
  }

  fetchPayment(paymentId: string) {
    return this.call<RazorpayPayment>("GET", `/payments/${encodeURIComponent(paymentId)}`);
  }

  // Payments made against an order (to find one whose confirmation never arrived).
  orderPayments(orderId: string) {
    return this.call<{ items: RazorpayPayment[] }>("GET", `/orders/${encodeURIComponent(orderId)}/payments`);
  }

  // For accounts without automatic capture: take an authorised payment.
  capture(paymentId: string, amountPaise: number, currency: string) {
    return this.call<RazorpayPayment>("POST", `/payments/${encodeURIComponent(paymentId)}/capture`, { amount: amountPaise, currency });
  }

  refund(paymentId: string, amountPaise: number, notes: Record<string, string>) {
    return this.call<RazorpayRefund>("POST", `/payments/${encodeURIComponent(paymentId)}/refund`, { amount: amountPaise, speed: "normal", notes });
  }

  // Checkout's handler: HMAC-SHA256(order_id|payment_id) with the key secret.
  checkoutSignatureValid(orderId: string, paymentId: string, signature: string) {
    if (!this.config.keySecret) return false;
    const expected = createHmac("sha256", this.config.keySecret).update(`${orderId}|${paymentId}`).digest("hex");
    return safeEqual(expected, signature);
  }

  // Webhooks: HMAC-SHA256 of the raw body with the webhook secret.
  webhookSignatureValid(rawBody: Buffer, signature: string | undefined) {
    if (!this.config.webhookSecret || !signature) return false;
    const expected = createHmac("sha256", this.config.webhookSecret).update(rawBody).digest("hex");
    return safeEqual(expected, signature);
  }

  private async call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
    if (!this.configured) throw new ServiceUnavailableException("Online payment isn't set up yet.");
    const auth = Buffer.from(`${this.config.keyId}:${this.config.keySecret}`).toString("base64");
    let response: Response;
    try {
      response = await fetch(`${API}${path}`, {
        method,
        headers: { Authorization: `Basic ${auth}`, ...(body ? { "Content-Type": "application/json" } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      throw new RazorpayError(`Razorpay unreachable: ${(error as Error).message}`, 0);
    }
    const data = (await response.json().catch(() => ({}))) as T & { error?: { description?: string; code?: string } };
    if (!response.ok) {
      const message = data.error?.description ?? `HTTP ${response.status}`;
      this.logger.warn(`Razorpay ${method} ${path.split("/")[1]} failed: ${message}`);
      throw new RazorpayError(message, response.status);
    }
    return data;
  }
}
