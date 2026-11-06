-- Wishlist: hotels a customer saved with the heart.
-- CreateTable
CREATE TABLE "saved_hotels" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT,
    "image_url" TEXT,
    "star_rating" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_hotels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "saved_hotels_user_id_hotel_id_key" ON "saved_hotels"("user_id", "hotel_id");

-- AddForeignKey
ALTER TABLE "saved_hotels" ADD CONSTRAINT "saved_hotels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
