import { BadRequestException, Body, Controller, Get, Headers, HttpCode, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CancelBookingDto } from "./dto/cancel-booking.dto.js";
import { Throttle } from "@nestjs/throttler";
import { LIMITS } from "../../common/throttle/limits.js";
import { requireCheckoutKey } from "../../common/utils/checkout-key.js";
import { AuthGuard, CurrentUserId } from "../auth/auth.guard.js";
import { BookingsQueryDto } from "./dto/bookings-query.dto.js";
import { pdfFile } from "../../documents/pdf-response.js";
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

  // Cancelling, with the same access as the booking itself.
  @Post("guest/:reference/cancel")
  @HttpCode(200)
  @Throttle(LIMITS.sensitive)
  cancelAsGuest(@Param("reference") ref: string, @Body() body: CancelBookingDto, @Headers("x-checkout-token") key?: string) {
    return this.bookings.cancel(reference(ref), { checkoutKey: requireCheckoutKey(key, "X-Checkout-Token") }, body);
  }

  @Post("link/:reference/cancel")
  @HttpCode(200)
  @Throttle(LIMITS.sensitive)
  cancelByLink(@Param("reference") ref: string, @Body() body: CancelBookingDto, @Query("t") token?: string) {
    return this.bookings.cancel(reference(ref), { link: token ?? "" }, body);
  }

  @Post(":reference/cancel")
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @Throttle(LIMITS.sensitive)
  cancelAsOwner(@CurrentUserId() userId: string, @Param("reference") ref: string, @Body() body: CancelBookingDto) {
    return this.bookings.cancel(reference(ref), { userId }, body);
  }

  // PDF vouchers, with the same access as the booking itself.
  @Get("guest/:reference/voucher")
  @Throttle(LIMITS.sensitive)
  async guestVoucher(@Param("reference") ref: string, @Headers("x-checkout-token") key?: string) {
    const booking = await this.bookings.forCheckout(reference(ref), requireCheckoutKey(key, "X-Checkout-Token"));
    return pdfFile(await this.bookings.voucher(booking), `voucher-${booking.reference}.pdf`);
  }

  @Get("link/:reference/voucher")
  @Throttle(LIMITS.sensitive)
  async linkVoucher(@Param("reference") ref: string, @Query("t") token?: string) {
    const booking = await this.bookings.forLink(reference(ref), token);
    return pdfFile(await this.bookings.voucher(booking), `voucher-${booking.reference}.pdf`);
  }

  @Get(":reference/voucher")
  @UseGuards(AuthGuard)
  async voucher(@CurrentUserId() userId: string, @Param("reference") ref: string) {
    const booking = await this.bookings.forUser(reference(ref), userId);
    return pdfFile(await this.bookings.voucher(booking), `voucher-${booking.reference}.pdf`);
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
