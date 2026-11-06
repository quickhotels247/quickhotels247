-- Checkout on booking attempts: the server-owned quote from the supplier's
-- review, guest details, terms acceptance, and a hashed access token.
ALTER TABLE "booking_attempts"
  ADD COLUMN "access_token_hash" TEXT,
  ADD COLUMN "expires_at" TIMESTAMPTZ,
  ADD COLUMN "quote" JSONB,
  ADD COLUMN "supplier_context" JSONB,
  ADD COLUMN "guest_details" JSONB,
  ADD COLUMN "amount" DECIMAL(12,2),
  ADD COLUMN "currency" CHAR(3),
  ADD COLUMN "terms_version" TEXT,
  ADD COLUMN "terms_accepted_at" TIMESTAMPTZ;
