import { Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Post, Put } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { LIMITS } from "../../common/throttle/limits.js";
import { requireCheckoutKey as checkoutKey } from "../../common/utils/checkout-key.js";
import { OptionalUser } from "../auth/optional-user.js";
import { ApplyCouponDto } from "../coupons/dto/apply-coupon.dto.js";
import { CheckoutService } from "./checkout.service.js";
import { CreateCheckoutDto } from "./dto/create-checkout.dto.js";
import { GuestDetailsDto } from "./dto/guest-details.dto.js";

// Checkout, under /api/v1/checkouts (spec §4.4). Guests can check out without
// signing in; each checkout opens only with the key its browser made.
@Controller("v1/checkouts")
export class CheckoutController {
  constructor(
    private readonly checkout: CheckoutService,
    private readonly user: OptionalUser,
  ) {}

  @Post()
  @Throttle(LIMITS.search)
  create(@Body() body: CreateCheckoutDto, @Headers("idempotency-key") key?: string) {
    return this.checkout.create(body.roomsId, body.optionId, checkoutKey(key, "Idempotency-Key"));
  }

  @Get(":id")
  get(@Param("id", new ParseUUIDPipe()) id: string, @Headers("x-checkout-token") key?: string) {
    return this.checkout.get(id, checkoutKey(key, "X-Checkout-Token"));
  }

  @Put(":id/guests")
  @Throttle(LIMITS.sensitive)
  saveGuests(@Param("id", new ParseUUIDPipe()) id: string, @Body() body: GuestDetailsDto, @Headers("x-checkout-token") key?: string) {
    return this.checkout.saveGuests(id, checkoutKey(key, "X-Checkout-Token"), body);
  }

  // Coupon codes: throttled like other guessable inputs.
  @Put(":id/coupon")
  @Throttle(LIMITS.sensitive)
  async applyCoupon(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() body: ApplyCouponDto,
    @Headers("x-checkout-token") key?: string,
    @Headers("authorization") authorization?: string,
  ) {
    return this.checkout.applyCoupon(id, checkoutKey(key, "X-Checkout-Token"), body.code, await this.user.from(authorization));
  }

  @Delete(":id/coupon")
  removeCoupon(@Param("id", new ParseUUIDPipe()) id: string, @Headers("x-checkout-token") key?: string) {
    return this.checkout.removeCoupon(id, checkoutKey(key, "X-Checkout-Token"));
  }
}
