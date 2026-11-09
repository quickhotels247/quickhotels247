-- Hotel payments: staff alert time on bookings, and finding stalled paid checkouts.
ALTER TABLE "bookings" ADD COLUMN "ops_alerted_at" TIMESTAMPTZ;
CREATE INDEX "booking_attempts_status_updated_at_idx" ON "booking_attempts"("status", "updated_at");
