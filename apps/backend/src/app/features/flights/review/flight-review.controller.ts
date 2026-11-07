import { Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Post, Put } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { LIMITS } from "../../../common/throttle/limits.js";
import { requireCheckoutKey } from "../../../common/utils/checkout-key.js";
import { CreateFlightReviewDto } from "./dto/create-flight-review.dto.js";
import { FlightTravellerDetailsDto } from "./dto/traveller-details.dto.js";
import { OptionalUser } from "../../auth/optional-user.js";
import { ApplyCouponDto } from "../../coupons/dto/apply-coupon.dto.js";
import { FlightReviewService } from "./flight-review.service.js";

// Flight fare review, under /api/v1/flights/reviews. Guests can book without
// signing in; each review opens only with the key its browser made.
@Controller("v1/flights/reviews")
export class FlightReviewController {
  constructor(
    private readonly reviews: FlightReviewService,
    private readonly user: OptionalUser,
  ) {}

  @Post()
  @Throttle(LIMITS.search)
  create(@Body() body: CreateFlightReviewDto, @Headers("idempotency-key") key?: string) {
    return this.reviews.create(body.searchId, body.fares, requireCheckoutKey(key, "Idempotency-Key"));
  }

  @Get(":id")
  get(@Param("id", new ParseUUIDPipe()) id: string, @Headers("x-checkout-token") key?: string) {
    return this.reviews.get(id, requireCheckoutKey(key, "X-Checkout-Token"));
  }

  // Travellers and contact (step F5); then payment.
  @Put(":id/travellers")
  @Throttle(LIMITS.sensitive)
  saveTravellers(@Param("id", new ParseUUIDPipe()) id: string, @Body() body: FlightTravellerDetailsDto, @Headers("x-checkout-token") key?: string) {
    return this.reviews.saveTravellers(id, requireCheckoutKey(key, "X-Checkout-Token"), body);
  }

  // Step F6: a Razorpay order to pay what's payable.
  @Post(":id/payment")
  @Throttle(LIMITS.sensitive)
  startPayment(@Param("id", new ParseUUIDPipe()) id: string, @Headers("x-checkout-token") key?: string) {
    return this.reviews.startPayment(id, requireCheckoutKey(key, "X-Checkout-Token"));
  }

  @Put(":id/coupon")
  @Throttle(LIMITS.sensitive)
  async applyCoupon(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() body: ApplyCouponDto,
    @Headers("x-checkout-token") key?: string,
    @Headers("authorization") authorization?: string,
  ) {
    return this.reviews.applyCoupon(id, requireCheckoutKey(key, "X-Checkout-Token"), body.code, await this.user.from(authorization));
  }

  @Delete(":id/coupon")
  removeCoupon(@Param("id", new ParseUUIDPipe()) id: string, @Headers("x-checkout-token") key?: string) {
    return this.reviews.removeCoupon(id, requireCheckoutKey(key, "X-Checkout-Token"));
  }
}
