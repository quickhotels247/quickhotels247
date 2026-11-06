import { Controller, Get, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { LIMITS } from "../../common/throttle/limits.js";
import { SuggestionsQueryDto } from "./dto/suggestions-query.dto.js";
import { DestinationsService } from "./destinations.service.js";

// Places for the destination box as the visitor types, under /api/v1/destinations.
@Controller("v1/destinations")
export class DestinationsController {
  constructor(private readonly destinations: DestinationsService) {}

  @Get("suggestions")
  @Throttle(LIMITS.suggest)
  suggestions(@Query() query: SuggestionsQueryDto) {
    return this.destinations.suggest(query.q, query.limit);
  }
}
