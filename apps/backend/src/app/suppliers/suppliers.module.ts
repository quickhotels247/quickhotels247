import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { FLIGHT_SUPPLIER } from "./flight-supplier.js";
import { HOTEL_SUPPLIER, type HotelSupplier } from "./hotel-supplier.js";
import { MockHotelSupplier } from "./mock/mock-hotel.supplier.js";
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
    // Flights come from TripJack only (no sample supplier).
    { provide: FLIGHT_SUPPLIER, useExisting: TripjackFlightSupplier },
    {
      provide: HOTEL_SUPPLIER,
      inject: [suppliersConfig.KEY, TripjackHotelSupplier, MockHotelSupplier],
      useFactory: (config: SuppliersConfig, tripjack: TripjackHotelSupplier, mock: MockHotelSupplier): HotelSupplier =>
        config.hotelSupplier === "tripjack" ? tripjack : mock,
    },
  ],
  exports: [HOTEL_SUPPLIER, FLIGHT_SUPPLIER, TripjackContentService],
})
export class SuppliersModule {}
