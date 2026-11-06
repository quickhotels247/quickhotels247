import { Injectable, Logger, type OnApplicationShutdown, type OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../../../generated/prisma/client.js";

const envNumber = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

// The app's database client. Prisma talks to PostgreSQL through a node-postgres
// pool on DATABASE_URL (Neon's pooled URL now, RDS later). Migrations use
// DIRECT_URL instead, through prisma.config.ts.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger("Database");
  private readonly pool: pg.Pool;

  constructor() {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: envNumber("PG_POOL_MAX", 20),
      // Opening a connection to a hosted database costs seconds (TLS, auth,
      // waking a suspended Neon compute; more from far away); a query on an
      // open one costs milliseconds. Keep idle connections for a minute, and
      // send TCP keep-alives every 10 s so routers and NATs don't silently
      // drop them (the OS default waits 2 hours, and a query sent on a
      // silently dropped connection hangs until query_timeout).
      idleTimeoutMillis: 60_000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
      // Fail instead of queueing forever when the pool is exhausted or the
      // database is unreachable, and never let one query hang.
      connectionTimeoutMillis: envNumber("PG_CONNECT_TIMEOUT_MS", 15_000),
      statement_timeout: 15_000,
      query_timeout: 20_000,
    });
    super({ adapter: new PrismaPg(pool) });
    this.pool = pool;
    // A dropped idle connection (Neon scaling to zero, a pooler restart) is
    // reported here; without a listener it would crash the process.
    pool.on("error", (error) => this.logger.error(`Idle connection lost: ${error.message}`));
  }

  // Open a connection at startup so the first request doesn't wait for one.
  async onModuleInit() {
    try {
      await this.$queryRaw`SELECT 1`;
    } catch (error) {
      this.logger.error(`Database not reachable: ${(error as Error).message}`);
    }
  }

  async onApplicationShutdown() {
    await this.$disconnect();
    await this.pool.end().catch(() => {});
  }
}
