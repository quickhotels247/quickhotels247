-- Help & support: the name and booking reference from the contact form, and
-- replies (emailed) as well as staff notes on tickets.
ALTER TABLE "support_tickets" ADD COLUMN "name" TEXT, ADD COLUMN "booking_reference" TEXT;
ALTER TABLE "support_notes" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'note';
CREATE INDEX "support_notes_ticket_id_idx" ON "support_notes"("ticket_id");
