import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { SuppliersModule } from "../../suppliers/suppliers.module.js";
import { HotelsModule } from "../hotels/hotels.module.js";
import { CheckoutController } from "./checkout.controller.js";
import { CheckoutRepository } from "./checkout.repository.js";
import { CheckoutService } from "./checkout.service.js";
import { HotelBookingService } from "./booking/hotel-booking.service.js";
import { HotelBookingsRepository } from "./booking/hotel-bookings.repository.js";
import { HotelReconciler } from "./booking/hotel-reconciler.service.js";
import { BookingsRepository } from "../bookings/bookings.repository.js";

@Module({
  imports: [AuthModule, SuppliersModule, HotelsModule],
  controllers: [CheckoutController],
  providers: [CheckoutService, CheckoutRepository, BookingsRepository, HotelBookingsRepository, HotelBookingService, HotelReconciler],
  exports: [CheckoutRepository, HotelBookingService],
})
export class CheckoutModule {}
