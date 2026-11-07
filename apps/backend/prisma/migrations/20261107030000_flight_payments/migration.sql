-- Flight payments (Razorpay) and what the airline issued after payment.
ALTER TABLE "payments" ADD COLUMN "flight_checkout_id" UUID;
ALTER TABLE "payments" ADD CONSTRAINT "payments_flight_checkout_id_fkey" FOREIGN KEY ("flight_checkout_id") REFERENCES "flight_checkouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "payments_flight_checkout_id_idx" ON "payments"("flight_checkout_id");

ALTER TABLE "flight_checkouts"
  ADD COLUMN "booking_result" JSONB,
  ADD COLUMN "booked_at" TIMESTAMPTZ,
  ADD COLUMN "failure_reason" TEXT;
