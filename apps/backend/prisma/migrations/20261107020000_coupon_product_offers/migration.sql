-- Coupons for hotels, flights or both, with an optional public offer title.
ALTER TABLE "coupons"
  ADD COLUMN "title" TEXT,
  ADD COLUMN "product" "PricingProduct",
  ADD COLUMN "public" BOOLEAN NOT NULL DEFAULT false;
