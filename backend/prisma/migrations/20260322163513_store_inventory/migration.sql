-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('active', 'expired', 'recalled');

-- CreateTable
CREATE TABLE "StoreInventory" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "medicine_id" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "mfg_date" TIMESTAMP(3) NOT NULL,
    "exp_date" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "selling_price" DECIMAL(65,30) NOT NULL,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 10,
    "status" "InventoryStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreInventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoreInventory_store_id_idx" ON "StoreInventory"("store_id");

-- CreateIndex
CREATE INDEX "StoreInventory_medicine_id_idx" ON "StoreInventory"("medicine_id");

-- CreateIndex
CREATE UNIQUE INDEX "StoreInventory_store_id_medicine_id_batch_number_key" ON "StoreInventory"("store_id", "medicine_id", "batch_number");

-- AddForeignKey
ALTER TABLE "StoreInventory" ADD CONSTRAINT "StoreInventory_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "PharmacyStore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreInventory" ADD CONSTRAINT "StoreInventory_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "MedicineMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
