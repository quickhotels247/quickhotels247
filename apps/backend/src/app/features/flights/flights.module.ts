import { Module } from "@nestjs/common";
import { SuppliersModule } from "../../suppliers/suppliers.module.js";
import { PopularRoutesController } from "./popular-routes/popular-routes.controller.js";
import { FlightReviewController } from "./review/flight-review.controller.js";
import { FlightReviewRepository } from "./review/flight-review.repository.js";
import { FlightReviewService } from "./review/flight-review.service.js";
import { PopularRoutesService } from "./popular-routes/popular-routes.service.js";
import { FlightSearchController } from "./search/flight-search.controller.js";
import { FlightSearchService } from "./search/flight-search.service.js";
import { FlightSearchSessionsRepository } from "./search/flight-search-sessions.repository.js";

// Flights: search/ (searches and their results), popular-routes/ (fares for
// the flights page) and review/ (fare check, then travellers and payment).
@Module({
  imports: [SuppliersModule],
  controllers: [FlightSearchController, PopularRoutesController, FlightReviewController],
  providers: [FlightSearchService, FlightSearchSessionsRepository, PopularRoutesService, FlightReviewService, FlightReviewRepository],
})
export class FlightsModule {}
