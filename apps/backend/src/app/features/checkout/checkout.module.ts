import { Module } from "@nestjs/common";
import { SuppliersModule } from "../../suppliers/suppliers.module.js";
import { HotelsModule } from "../hotels/hotels.module.js";
import { CheckoutController } from "./checkout.controller.js";
import { CheckoutRepository } from "./checkout.repository.js";
import { CheckoutService } from "./checkout.service.js";

@Module({
  imports: [SuppliersModule, HotelsModule],
  controllers: [CheckoutController],
  providers: [CheckoutService, CheckoutRepository],
})
export class CheckoutModule {}
