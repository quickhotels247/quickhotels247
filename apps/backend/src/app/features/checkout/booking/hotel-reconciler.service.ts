import { Injectable, Logger, type OnApplicationBootstrap, type OnModuleDestroy } from "@nestjs/common";
import { CheckoutRepository } from "../checkout.repository.js";
import { HotelBookingService } from "./hotel-booking.service.js";
import { HotelBookingsRepository } from "./hotel-bookings.repository.js";

const EVERY_MS = 60_000;

// Every minute: paid hotel checkouts that stalled (server restart, slow
// hotel) are moved on, and the team is told about any still unconfirmed 30
// minutes after payment. Off in tests.
@Injectable()
export class HotelReconciler implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(HotelReconciler.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly checkouts: CheckoutRepository,
    private readonly bookings: HotelBookingsRepository,
    private readonly booking: HotelBookingService,
  ) {}

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
      for (const checkout of await this.checkouts.stuck()) {
        await this.booking.resume(checkout).catch((error: Error) => this.logger.warn(`Resuming ${checkout.id} failed: ${(error as Error).message}`));
      }
      for (const booking of await this.bookings.slowToTell()) await this.booking.alertSlow(booking);
    } catch (error) {
      this.logger.error(`Hotel reconciliation failed: ${(error as Error).message}`);
    } finally {
      this.running = false;
    }
  }
}
