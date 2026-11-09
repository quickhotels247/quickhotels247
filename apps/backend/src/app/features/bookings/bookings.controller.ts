import { BadRequestException, Controller, Get, Headers, Param, Query, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { LIMITS } from "../../common/throttle/limits.js";
import { requireCheckoutKey } from "../../common/utils/checkout-key.js";
import { AuthGuard, CurrentUserId } from "../auth/auth.guard.js";
import { BookingsQueryDto } from "./dto/bookings-query.dto.js";
import { BookingsService } from "./bookings.service.js";

// "QH-7K2M9P"-style references.
function reference(value: string) {
  if (!/^[A-Za-z0-9-]{4,20}$/.test(value)) throw new BadRequestException("That isn't a booking reference.");
  return value;
}

// Customers' bookings, under /api/v1/bookings.
@Controller("v1/bookings")
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  // The signed-in customer's bookings: ?tab=upcoming|past|cancelled&q=&page=
  @Get()
  @UseGuards(AuthGuard)
  list(@CurrentUserId() userId: string, @Query() query: BookingsQueryDto) {
    return this.bookings.list(userId, query.tab, query.q, query.page);
  }

  // A guest's booking, with the X-Checkout-Token of the checkout that made it.
  // (Declared before :reference so "guest" isn't read as a reference.)
  @Get("guest/:reference")
  forCheckout(@Param("reference") ref: string, @Headers("x-checkout-token") key?: string) {
    return this.bookings.forCheckout(reference(ref), requireCheckoutKey(key, "X-Checkout-Token"));
  }

  // From the confirmation email: /bookings/link/QH-…?t=<link token>.
  @Get("link/:reference")
  @Throttle(LIMITS.sensitive)
  forLink(@Param("reference") ref: string, @Query("t") token?: string) {
    return this.bookings.forLink(reference(ref), token);
  }

  @Get(":reference")
  @UseGuards(AuthGuard)
  forUser(@CurrentUserId() userId: string, @Param("reference") ref: string) {
    return this.bookings.forUser(reference(ref), userId);
  }
}
