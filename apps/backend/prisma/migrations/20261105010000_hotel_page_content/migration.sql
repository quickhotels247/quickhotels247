-- Full hotel content for the hotel page (description sections, policies,
-- room types, all photos), fetched from the supplier on first view.
ALTER TABLE "hotel_content_cache" ADD COLUMN "details" JSONB;
ALTER TABLE "hotel_content_cache" ADD COLUMN "details_fetched_at" TIMESTAMPTZ;
