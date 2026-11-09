import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { CheckoutModule } from "../checkout/checkout.module.js";
import { SuppliersModule } from "../../suppliers/suppliers.module.js";
import { HotelCancellationReconciler } from "./cancellation/hotel-cancellation-reconciler.service.js";
import { HotelCancellationService } from "./cancellation/hotel-cancellation.service.js";
import { HotelCancellationsRepository } from "./cancellation/hotel-cancellations.repository.js";
import { BookingsController } from "./bookings.controller.js";
import { BookingsRepository } from "./bookings.repository.js";
import { BookingsService } from "./bookings.service.js";

@Module({
  imports: [AuthModule, CheckoutModule, SuppliersModule],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsRepository, HotelCancellationsRepository, HotelCancellationService, HotelCancellationReconciler],
})
export class BookingsModule {}
