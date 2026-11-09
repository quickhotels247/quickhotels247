-- Money safety: coupon uses recorded per payment (flights have no booking
-- row), and when a flight was paid / staff alerted, for the reconciler.
ALTER TABLE "coupon_redemptions" ALTER COLUMN "booking_id" DROP NOT NULL;
ALTER TABLE "coupon_redemptions" ADD COLUMN "payment_id" UUID;
CREATE UNIQUE INDEX "coupon_redemptions_payment_id_key" ON "coupon_redemptions"("payment_id");
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "flight_checkouts" ADD COLUMN "paid_at" TIMESTAMPTZ, ADD COLUMN "ops_alerted_at" TIMESTAMPTZ;
CREATE INDEX "flight_checkouts_status_updated_at_idx" ON "flight_checkouts"("status", "updated_at");
