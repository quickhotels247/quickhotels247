-- Cheapest fare per adult by route, day and cabin (flight date picker prices).
CREATE TABLE "flight_fare_days" (
    "from_code" CHAR(3) NOT NULL,
    "to_code" CHAR(3) NOT NULL,
    "date" DATE NOT NULL,
    "cabin" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flight_fare_days_pkey" PRIMARY KEY ("from_code","to_code","cabin","date")
);
