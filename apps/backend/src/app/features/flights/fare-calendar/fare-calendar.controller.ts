import { Controller, Get, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { LIMITS } from "../../../common/throttle/limits.js";
import { FareCalendarQueryDto } from "./dto/fare-calendar-query.dto.js";
import { FareCalendarService } from "./fare-calendar.service.js";

// Recent cheapest fares by day, for the date picker: /api/v1/flights/fare-calendar.
@Controller("v1/flights/fare-calendar")
export class FareCalendarController {
  constructor(private readonly calendar: FareCalendarService) {}

  @Get()
  @Throttle(LIMITS.search)
  get(@Query() query: FareCalendarQueryDto) {
    return this.calendar.calendar(query.from, query.to, query.cabin, query.start, query.days);
  }
}
