import { Controller, Get, Query, ServiceUnavailableException } from "@nestjs/common";
import { DestinationStatsQueryDto } from "./dto/destination-stats-query.dto.js";
import { HomeService } from "./home.service.js";

// Data for the home page sections, under /api/v1/home. Cached server-side.
@Controller("v1/home")
export class HomeController {
  constructor(private readonly home: HomeService) {}

  @Get("top-hotels")
  topHotels() {
    return this.home.topRated().catch(unavailable);
  }

  @Get("weekend-deals")
  weekendDeals() {
    return this.home.weekendDeals().catch(unavailable);
  }

  // Hotels per destination: ?names=Goa,Mumbai
  @Get("destination-stats")
  destinationStats(@Query() query: DestinationStatsQueryDto) {
    return this.home.destinationStats(query.names);
  }
}

// The website hides a section it can't load; details are in the server log.
function unavailable(): never {
  throw new ServiceUnavailableException("Prices aren't available right now.");
}
