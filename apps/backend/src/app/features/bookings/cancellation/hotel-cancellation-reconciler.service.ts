import { Injectable, Logger, type OnApplicationBootstrap, type OnModuleDestroy } from "@nestjs/common";
import { HotelCancellationService } from "./hotel-cancellation.service.js";
import { HotelCancellationsRepository } from "./hotel-cancellations.repository.js";

const EVERY_MS = 10 * 60_000;

// Cancellations the supplier handles offline (CANCELLATION_PENDING): checked
// about once an hour until cancelled, then refunded. Off in tests.
@Injectable()
export class HotelCancellationReconciler implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(HotelCancellationReconciler.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly cancellations: HotelCancellationsRepository,
    private readonly service: HotelCancellationService,
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
    try {
      for (const { id } of await this.cancellations.waiting()) await this.service.follow(id, 1);
    } catch (error) {
      this.logger.error(`Cancellation check failed: ${(error as Error).message}`);
    }
  }
}
