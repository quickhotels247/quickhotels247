-- AlterTable
ALTER TABLE "hotels" ADD COLUMN     "hero_image_url" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "region_id" TEXT;

-- AlterTable
ALTER TABLE "search_sessions" ADD COLUMN     "supplier_context" JSONB;

-- CreateTable
CREATE TABLE "supplier_regions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "supplier" TEXT NOT NULL DEFAULT 'tripjack',
    "region_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city_name" TEXT NOT NULL,
    "country_name" TEXT NOT NULL,
    "region_type" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "hotels_synced_at" TIMESTAMPTZ,
    "hotel_count" INTEGER,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_regions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supplier_regions_supplier_name_idx" ON "supplier_regions"("supplier", "name");

-- CreateIndex
CREATE INDEX "supplier_regions_supplier_city_name_idx" ON "supplier_regions"("supplier", "city_name");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_regions_supplier_region_id_key" ON "supplier_regions"("supplier", "region_id");

-- CreateIndex
CREATE INDEX "hotels_supplier_region_id_idx" ON "hotels"("supplier", "region_id");
