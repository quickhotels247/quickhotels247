-- Saved travellers on the customer account, used to fill checkout forms.
-- CreateTable
CREATE TABLE "saved_travellers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" DATE,
    "nationality" TEXT,
    "passport_number" TEXT,
    "passport_expiry" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_travellers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_travellers_user_id_idx" ON "saved_travellers"("user_id");

-- AddForeignKey
ALTER TABLE "saved_travellers" ADD CONSTRAINT "saved_travellers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
