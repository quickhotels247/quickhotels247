import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PricingService } from "../pricing/pricing.service.js";
import { FLIGHT_SUPPLIER, type FlightSupplier } from "./flight-supplier.js";
import { HOTEL_SUPPLIER, type HotelSupplier } from "./hotel-supplier.js";
import { MockHotelSupplier } from "./mock/mock-hotel.supplier.js";
import { PricedFlightSupplier } from "./priced/priced-flight.supplier.js";
import { PricedHotelSupplier } from "./priced/priced-hotel.supplier.js";
import { SupplierEventsRepository } from "./supplier-events.repository.js";
import { suppliersConfig, type SuppliersConfig } from "./suppliers.config.js";
import { TripjackFlightSupplier } from "./tripjack/flights/tripjack-flight.supplier.js";
import { TripjackClient } from "./tripjack/tripjack.client.js";
import { TripjackContentRepository } from "./tripjack/tripjack-content.repository.js";
import { TripjackContentService } from "./tripjack/tripjack-content.service.js";
import { tripjackConfig } from "./tripjack/tripjack.config.js";
import { TripjackHotelSupplier } from "./tripjack/tripjack-hotel.supplier.js";

// Outside suppliers. Features inject HOTEL_SUPPLIER / FLIGHT_SUPPLIER and never
// know which one is behind it. Hotels: HOTEL_SUPPLIER=tripjack in .env, or the
// sample one by default. Flights: TripJack.
@Module({
  imports: [ConfigModule.forFeature(suppliersConfig), ConfigModule.forFeature(tripjackConfig)],
  providers: [
    SupplierEventsRepository,
    TripjackClient,
    TripjackContentRepository,
    TripjackContentService,
    TripjackHotelSupplier,
    MockHotelSupplier,
    TripjackFlightSupplier,
    // Flights come from TripJack only (no sample supplier). Both wrapped so
    // every price carries our markup (admin → Pricing).
    {
      provide: FLIGHT_SUPPLIER,
      inject: [TripjackFlightSupplier, PricingService],
      useFactory: (tripjack: TripjackFlightSupplier, pricing: PricingService): FlightSupplier => new PricedFlightSupplier(tripjack, pricing),
    },
    {
      provide: HOTEL_SUPPLIER,
      inject: [suppliersConfig.KEY, TripjackHotelSupplier, MockHotelSupplier, PricingService],
      useFactory: (config: SuppliersConfig, tripjack: TripjackHotelSupplier, mock: MockHotelSupplier, pricing: PricingService): HotelSupplier =>
        new PricedHotelSupplier(config.hotelSupplier === "tripjack" ? tripjack : mock, pricing),
    },
  ],
  exports: [HOTEL_SUPPLIER, FLIGHT_SUPPLIER, TripjackContentService],
})
export class SuppliersModule {}
