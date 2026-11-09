import { Controller, Get, Headers, Param, ParseUUIDPipe, Query, UseGuards } from "@nestjs/common";
import { AuthGuard, CurrentUserId } from "../../auth/auth.guard.js";
import { OptionalUser } from "../../auth/optional-user.js";
import { FlightReviewService } from "../review/flight-review.service.js";
import { BookingLinkQueryDto, FlightBookingsQueryDto } from "./dto/flight-bookings-query.dto.js";

// The customer's flight bookings: My bookings (signed in), and one booking by
// its owner or its private email link (?t=…).
@Controller("v1/flights/bookings")
export class FlightBookingsController {
  constructor(
    private readonly reviews: FlightReviewService,
    private readonly user: OptionalUser,
  ) {}

  @Get()
  @UseGuards(AuthGuard)
  list(@CurrentUserId() userId: string, @Query() query: FlightBookingsQueryDto) {
    return this.reviews.listForCustomer(userId, query.tab, query.q, query.page);
  }

  @Get(":id")
  async get(@Param("id", new ParseUUIDPipe()) id: string, @Query() query: BookingLinkQueryDto, @Headers("authorization") authorization?: string) {
    return this.reviews.viewForCustomer(id, { userId: await this.user.from(authorization), token: query.t ?? null });
  }
}
