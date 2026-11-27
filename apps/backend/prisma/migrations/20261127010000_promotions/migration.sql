-- Automatic hotel discounts (admin → Promotions).
CREATE TABLE "promotions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "discount_type" "DiscountType" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "max_discount" DECIMAL(12,2),
    "valid_from" TIMESTAMPTZ,
    "valid_to" TIMESTAMPTZ,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "RuleStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by_admin_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "promotions_status_idx" ON "promotions"("status");

ALTER TABLE "promotions" ADD CONSTRAINT "promotions_created_by_admin_id_fkey"
    FOREIGN KEY ("created_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
