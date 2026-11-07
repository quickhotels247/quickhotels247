import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { appConfig } from "./common/config/app.config.js";
import { DatabaseModule } from "./common/database/database.module.js";
import { AdminModule } from "./features/admin/admin.module.js";
import { AuthModule } from "./features/auth/auth.module.js";
import { AccountModule } from "./features/account/account.module.js";
import { CouponsModule } from "./features/coupons/coupons.module.js";
import { SupportModule } from "./features/support/support.module.js";
import { FlightsModule } from "./features/flights/flights.module.js";
import { HomeModule } from "./features/home/home.module.js";
import { BookingsModule } from "./features/bookings/bookings.module.js";
import { CheckoutModule } from "./features/checkout/checkout.module.js";
import { DestinationsModule } from "./features/destinations/destinations.module.js";
import { HotelsModule } from "./features/hotels/hotels.module.js";
import { MailModule } from "./mail/mail.module.js";
import { PricingModule } from "./pricing/pricing.module.js";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    // Per client address: a generous default for everything, with tighter
    // limits on sign-in, sign-up and email routes (see @Throttle on them).
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 300 }]),
    DatabaseModule,
    MailModule,
    PricingModule,
    AuthModule,
    AccountModule,
    SupportModule,
    CouponsModule,
    HotelsModule,
    FlightsModule,
    HomeModule,
    DestinationsModule,
    CheckoutModule,
    BookingsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
