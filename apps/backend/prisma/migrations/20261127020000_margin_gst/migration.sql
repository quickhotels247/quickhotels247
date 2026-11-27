-- GST charged on our hotel margin (agent model), kept apart from earnings.
ALTER TABLE "booking_price_snapshots" ADD COLUMN "margin_gst" DECIMAL(12,2) NOT NULL DEFAULT 0;
