import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Rows that are never useful again, deleted hourly so tables don't grow
// forever. Safe to run on several servers at once.
@Injectable()
export class CleanupService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(CleanupService.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly db: PrismaService) {}

  onApplicationBootstrap() {
    this.timer = setInterval(() => void this.run(), HOUR);
    this.timer.unref();
  }

  onApplicationShutdown() {
    clearInterval(this.timer);
  }

  async run() {
    const monthAgo = new Date(Date.now() - 30 * DAY);
    const dayAgo = new Date(Date.now() - DAY);
    const tasks = [
      // Sessions ended (revoked or expired) more than 30 days ago.
      () => this.db.authToken.deleteMany({ where: { OR: [{ revokedAt: { lt: monthAgo } }, { expiresAt: { lt: monthAgo } }] } }),
      () => this.db.adminToken.deleteMany({ where: { OR: [{ revokedAt: { lt: monthAgo } }, { expiresAt: { lt: monthAgo } }] } }),
      // Sign-up codes and their follow-up tokens, a day after they lapsed.
      () =>
        this.db.emailVerification.deleteMany({
          where: { expiresAt: { lt: dayAgo }, OR: [{ tokenExpiresAt: null }, { tokenExpiresAt: { lt: dayAgo } }] },
        }),
    ];
    for (const task of tasks) {
      try {
        await task();
      } catch (error) {
        this.logger.warn(`Cleanup failed: ${(error as Error).message}`);
      }
    }
  }
}
