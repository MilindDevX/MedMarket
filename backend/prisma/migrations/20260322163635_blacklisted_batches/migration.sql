-- CreateTable
CREATE TABLE "BlacklistedBatch" (
    "id" TEXT NOT NULL,
    "medicine_id" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "blacklisted_by" TEXT,
    "blacklisted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlacklistedBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlacklistedBatch_medicine_id_idx" ON "BlacklistedBatch"("medicine_id");

-- CreateIndex
CREATE INDEX "BlacklistedBatch_batch_number_idx" ON "BlacklistedBatch"("batch_number");

-- AddForeignKey
ALTER TABLE "BlacklistedBatch" ADD CONSTRAINT "BlacklistedBatch_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "MedicineMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlacklistedBatch" ADD CONSTRAINT "BlacklistedBatch_blacklisted_by_fkey" FOREIGN KEY ("blacklisted_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
