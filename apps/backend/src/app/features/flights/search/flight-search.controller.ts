import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { LIMITS } from "../../../common/throttle/limits.js";
import { FlightResultsQueryDto } from "./dto/flight-results-query.dto.js";
import { SearchFlightsDto } from "./dto/search-flights.dto.js";
import { FlightSearchService } from "./flight-search.service.js";

// Public flight search, under /api/v1/flights/searches.
@Controller("v1/flights/searches")
export class FlightSearchController {
  constructor(private readonly flights: FlightSearchService) {}

  // Starts a search and returns page 1 of the first list (paging, sort and filters optional).
  @Post()
  @HttpCode(200)
  @Throttle(LIMITS.search)
  search(@Body() dto: SearchFlightsDto, @Query() query: FlightResultsQueryDto) {
    return this.flights.search(dto, null, query.toView(1));
  }

  // Any page of any list of an existing search, sorted and filtered.
  @Get(":searchId/results")
  @Throttle(LIMITS.search)
  results(@Param("searchId", new ParseUUIDPipe()) searchId: string, @Query() query: FlightResultsQueryDto) {
    return this.flights.results(searchId, query.toView());
  }
}
