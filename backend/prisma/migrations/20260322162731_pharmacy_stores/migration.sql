/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `otp_tokens` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- AlterTable
ALTER TABLE "otp_tokens" DROP CONSTRAINT "otp_tokens_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "otp_tokens_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "otp_tokens_id_seq";

-- CreateTable
CREATE TABLE "PharmacyStore" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address_line" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "operating_hours" JSONB,
    "status" "StoreStatus" NOT NULL DEFAULT 'pending',
    "rejection_reason" TEXT,
    "drug_license_no" TEXT NOT NULL,
    "gst_number" TEXT NOT NULL,
    "fssai_no" TEXT,
    "verified_at" TIMESTAMP(3),
    "verified_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyStore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyStore_drug_license_no_key" ON "PharmacyStore"("drug_license_no");

-- CreateIndex
CREATE INDEX "PharmacyStore_owner_id_idx" ON "PharmacyStore"("owner_id");

-- AddForeignKey
ALTER TABLE "PharmacyStore" ADD CONSTRAINT "PharmacyStore_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyStore" ADD CONSTRAINT "PharmacyStore_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
