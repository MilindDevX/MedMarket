-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('drug_license', 'gst_certificate', 'aadhaar', 'pan', 'store_photo');

-- CreateTable
CREATE TABLE "StoreDocument" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "doc_type" "DocumentType" NOT NULL,
    "s3_key" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoreDocument_store_id_idx" ON "StoreDocument"("store_id");

-- AddForeignKey
ALTER TABLE "StoreDocument" ADD CONSTRAINT "StoreDocument_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "PharmacyStore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
