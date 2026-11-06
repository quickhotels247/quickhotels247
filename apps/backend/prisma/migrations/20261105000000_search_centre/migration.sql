-- Where a search measures hotel distances from (a landmark or the middle of
-- the area's hotels), shown with the distance filter.
ALTER TABLE "search_sessions" ADD COLUMN "centre" JSONB;
