import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { defaultSearchStay } from "../../common/config/stay-defaults.js";
import { LIMITS } from "../../common/throttle/limits.js";
import { ResultsQueryDto } from "./dto/results-query.dto.js";
import { SearchHotelsDto } from "./dto/search-hotels.dto.js";
import { HotelsService } from "./hotels.service.js";

// Public hotel search, under /api/v1 (spec §7.1). Signed-out visitors can
// search, so no auth guard; searches are rate limited per address.
@Controller("v1/searches")
export class HotelsController {
  constructor(private readonly hotels: HotelsService) {}

  // Starts a search and returns page 1 (?pageSize=&sort= and filters optional).
  @Post()
  @HttpCode(200)
  @Throttle(LIMITS.search)
  search(@Body() dto: SearchHotelsDto, @Query() query: ResultsQueryDto) {
    // Signed-in searches will record the user once login lands (step 4e).
    const { checkIn, checkOut } = dto.checkIn && dto.checkOut ? { checkIn: dto.checkIn, checkOut: dto.checkOut } : defaultSearchStay();
    return this.hotels.search({ ...dto, checkIn, checkOut }, null, query.toView(1));
  }

  // Any page of an existing search, in any sort order and with any filters.
  @Get(":searchId/results")
  @Throttle(LIMITS.search)
  results(@Param("searchId", new ParseUUIDPipe()) searchId: string, @Query() query: ResultsQueryDto) {
    return this.hotels.results(searchId, query.toView());
  }
}
