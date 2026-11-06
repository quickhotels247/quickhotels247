import "reflect-metadata";
import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DatabaseModule } from "../app/common/database/database.module.js";
import { SuppliersModule } from "../app/suppliers/suppliers.module.js";
import { TripjackContentService } from "../app/suppliers/tripjack/tripjack-content.service.js";

// Loads (or refreshes) all of TripJack's regions into supplier_regions, so
// typed destinations can be matched. Run once after setup, then about weekly.
// Usage: yarn workspace @quickhotels/backend tripjack:sync-regions
@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, SuppliersModule] })
class SyncRegionsModule {}

const logger = new Logger("tripjack:sync-regions");
const app = await NestFactory.createApplicationContext(SyncRegionsModule, { logger: ["error", "warn", "log"] });
try {
  const started = Date.now();
  let lastLogged = 0;
  const total = await app.get(TripjackContentService).syncRegions((done) => {
    if (done - lastLogged >= 50_000) {
      logger.log(`${done.toLocaleString("en-IN")} regions saved…`);
      lastLogged = done;
    }
  });
  logger.log(`Done: ${total.toLocaleString("en-IN")} regions in ${Math.round((Date.now() - started) / 1000)} s.`);
} catch (error) {
  logger.error(`Failed: ${(error as Error).message}`);
  process.exitCode = 1;
} finally {
  await app.close();
}
