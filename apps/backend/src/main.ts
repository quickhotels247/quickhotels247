import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { json } from "express";
import { AppModule } from "./app/app.module.js";
import type { AppConfig } from "./app/common/config/app.config.js";
import { checkProductionEnv } from "./app/common/config/production-env.js";
import { createValidationPipe } from "./app/common/pipes/validation.pipe.js";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const { missing, warnings } = checkProductionEnv();
  for (const warning of warnings) logger.warn(warning);
  if (missing.length) {
    throw new Error(`Missing production settings: ${missing.join(", ")}`);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  // Every route takes small bodies, so a flood of large ones can't exhaust
  // memory before auth runs.
  // The Razorpay webhook's signature covers the exact bytes sent, so keep them.
  app.use(
    json({
      limit: "100kb",
      verify: (request, _response, buffer) => {
        if ((request as { url?: string }).url?.startsWith("/api/v1/payments/razorpay/webhook")) (request as { rawBody?: Buffer }).rawBody = buffer;
      },
    }),
  );
  const config = app.get(ConfigService).getOrThrow<AppConfig>("app");

  app.disable("x-powered-by");
  // Behind a load balancer, the client's address comes from X-Forwarded-For.
  // Set TRUST_PROXY to the number of proxies in front (e.g. 1); rate limits and
  // the admin lockout key on that address.
  if (config.trustProxy !== false) app.set("trust proxy", config.trustProxy);
  app.setGlobalPrefix("api");
  app.useGlobalPipes(createValidationPipe());
  // Bearer tokens, not cookies: no credentials needed cross-origin.
  // Content-Disposition carries a download's file name (e.g. vouchers).
  app.enableCors({ origin: config.corsOrigins, exposedHeaders: ["Content-Disposition"] });
  app.enableShutdownHooks();

  await app.listen(config.port);
  logger.log(`backend listening on port ${config.port}`);
}

void bootstrap();
