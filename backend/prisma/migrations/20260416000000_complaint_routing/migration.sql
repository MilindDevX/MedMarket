-- Add category and store_id to Complaint for proper routing
ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'order';
ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "store_id" TEXT;
