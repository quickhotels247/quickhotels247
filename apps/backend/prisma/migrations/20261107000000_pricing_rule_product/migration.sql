-- Markup rules for flights as well as hotels, and an airline scope.
ALTER TYPE "PricingScope" ADD VALUE 'AIRLINE';

CREATE TYPE "PricingProduct" AS ENUM ('HOTEL', 'FLIGHT');

ALTER TABLE "pricing_rules" ADD COLUMN "product" "PricingProduct" NOT NULL DEFAULT 'HOTEL';

DROP INDEX IF EXISTS "pricing_rules_status_priority_idx";
CREATE INDEX "pricing_rules_product_status_priority_idx" ON "pricing_rules"("product", "status", "priority");
