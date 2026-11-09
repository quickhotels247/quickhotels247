import { Injectable, Logger, type OnApplicationBootstrap, type OnModuleDestroy } from "@nestjs/common";
import { FlightReviewRepository } from "../review/flight-review.repository.js";
import { FlightBookingService } from "./flight-booking.service.js";

const EVERY_MS = 60_000;

// Every minute: paid flight bookings that stalled (server restart, slow
// airline) are moved on, and the team is told about any still without
// tickets 30 minutes after payment. Off in tests.
@Injectable()
export class FlightReconciler implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(FlightReconciler.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly reviews: FlightReviewRepository,
    private readonly booking: FlightBookingService,
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
      for (const review of await this.reviews.stuck()) {
        await this.booking.resume(review).catch((error: Error) => this.logger.warn(`Resuming ${review.id} failed: ${error.message}`));
      }
      for (const review of await this.reviews.slowToTell()) await this.booking.alertSlow(review);
    } catch (error) {
      this.logger.error(`Flight reconciliation failed: ${(error as Error).message}`);
    } finally {
      this.running = false;
    }
  }
}
