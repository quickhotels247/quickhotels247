import { Global, Module } from "@nestjs/common";
import { PricingRulesRepository } from "./pricing-rules.repository.js";
import { PricingService } from "./pricing.service.js";

// Markup rules and applying them to supplier prices.
@Global()
@Module({
  providers: [PricingRulesRepository, PricingService],
  exports: [PricingRulesRepository, PricingService],
})
export class PricingModule {}
