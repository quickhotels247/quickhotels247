import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "./common/database/prisma.service.js";

@Injectable()
export class AppService {
  constructor(private readonly db: PrismaService) {}

  // A load balancer stops sending traffic here when the database is unreachable.
  async health() {
    try {
      await Promise.race([
        this.db.$queryRaw`SELECT 1`,
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 2_000).unref()),
      ]);
      return { status: "ok" };
    } catch {
      throw new ServiceUnavailableException("Database unreachable.");
    }
  }
}
