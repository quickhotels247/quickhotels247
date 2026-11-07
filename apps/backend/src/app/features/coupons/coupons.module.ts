import { Global, Module } from "@nestjs/common";
import { CouponsRepository } from "./coupons.repository.js";
import { CouponsService } from "./coupons.service.js";
import { OffersController } from "./offers.controller.js";

// Coupon codes: checking them at checkout, Home offers, and the admin's list.
@Global()
@Module({
  controllers: [OffersController],
  providers: [CouponsRepository, CouponsService],
  exports: [CouponsRepository, CouponsService],
})
export class CouponsModule {}
