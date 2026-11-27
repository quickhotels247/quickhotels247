import { Global, Module } from "@nestjs/common";
import { PricingRulesRepository } from "./pricing-rules.repository.js";
import { PricingService } from "./pricing.service.js";
import { PromotionsRepository } from "./promotions.repository.js";

// Markup rules and applying them to supplier prices.
@Global()
@Module({
  providers: [PricingRulesRepository, PromotionsRepository, PricingService],
  exports: [PricingRulesRepository, PromotionsRepository, PricingService],
})
export class PricingModule {}
