-- Personal details and email preferences on the customer account.
ALTER TABLE "users"
  ADD COLUMN "date_of_birth" DATE,
  ADD COLUMN "nationality" TEXT,
  ADD COLUMN "gender" TEXT,
  ADD COLUMN "address" JSONB,
  ADD COLUMN "notify_deals" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "notify_trip_reminders" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notify_reviews" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "preferences_updated_at" TIMESTAMPTZ;
