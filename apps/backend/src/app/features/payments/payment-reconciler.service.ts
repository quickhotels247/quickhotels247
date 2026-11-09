import { Injectable, Logger, type OnApplicationBootstrap, type OnModuleDestroy } from "@nestjs/common";
import { PaymentsService } from "./payments.service.js";

const EVERY_MS = 2 * 60_000;

// Every 2 minutes: unpaid orders whose payment report never arrived are
// checked with Razorpay, so a paid booking is never left waiting. Off in tests.
@Injectable()
export class PaymentReconciler implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(PaymentReconciler.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(private readonly payments: PaymentsService) {}

  onApplicationBootstrap() {
    if (process.env.VITEST || process.env.NODE_ENV === "test") return;
    this.timer = setInterval(() => void this.run(), EVERY_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async run() {
    if (this.running) return;
    this.running = true;
    try {
      const settled = await this.payments.reconcileOpenOrders();
      if (settled) this.logger.log(`Settled ${settled} payment(s) found on Razorpay.`);
    } catch (error) {
      this.logger.error(`Payment reconciliation failed: ${(error as Error).message}`);
    } finally {
      this.running = false;
    }
  }
}
