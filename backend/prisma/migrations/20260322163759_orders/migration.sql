-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('delivery', 'pickup');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('confirmed', 'accepted', 'packing', 'dispatched', 'delivered', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('upi', 'card', 'cod');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "consumer_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "delivery_type" "DeliveryType" NOT NULL,
    "delivery_address" JSONB,
    "status" "OrderStatus" NOT NULL DEFAULT 'confirmed',
    "subtotal" DECIMAL(65,30) NOT NULL,
    "delivery_fee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "gst_amount" DECIMAL(65,30) NOT NULL,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "payment_ref" TEXT,
    "rejection_reason" TEXT,
    "accepted_at" TIMESTAMP(3),
    "dispatched_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Order_consumer_id_idx" ON "Order"("consumer_id");

-- CreateIndex
CREATE INDEX "Order_store_id_idx" ON "Order"("store_id");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_consumer_id_fkey" FOREIGN KEY ("consumer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "PharmacyStore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
