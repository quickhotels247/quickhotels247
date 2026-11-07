import { Controller, Get } from "@nestjs/common";
import { CouponsService } from "./coupons.service.js";

@Controller("v1/offers")
export class OffersController {
  constructor(private readonly coupons: CouponsService) {}

  // Public, active coupons with a title (Home → Offers).
  @Get()
  list() {
    return this.coupons.publicOffers();
  }
}
