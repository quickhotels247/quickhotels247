-- AlterTable
ALTER TABLE "search_sessions" ADD COLUMN     "next_cursor" JSONB,
ADD COLUMN     "results" JSONB;

-- CreateTable
CREATE TABLE "flight_search_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "criteria" JSONB NOT NULL,
    "supplier" TEXT NOT NULL DEFAULT 'tripjack',
    "results" JSONB NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flight_search_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flight_search_sessions_created_at_idx" ON "flight_search_sessions"("created_at");
