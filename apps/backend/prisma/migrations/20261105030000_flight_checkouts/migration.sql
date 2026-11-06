-- Flight checkouts (flights steps F4–F6): reviewed fares, travellers, payment.
-- CreateTable
CREATE TABLE "flight_checkouts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key_hash" TEXT NOT NULL,
    "user_id" UUID,
    "search_session_id" UUID,
    "supplier" TEXT NOT NULL DEFAULT 'tripjack',
    "supplier_booking_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'travellers',
    "quote" JSONB NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "travellers" JSONB,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "terms_version" TEXT,
    "terms_accepted_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flight_checkouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "flight_checkouts_key_hash_key" ON "flight_checkouts"("key_hash");

-- CreateIndex
CREATE INDEX "flight_checkouts_user_id_idx" ON "flight_checkouts"("user_id");

-- CreateIndex
CREATE INDEX "flight_checkouts_created_at_idx" ON "flight_checkouts"("created_at");

