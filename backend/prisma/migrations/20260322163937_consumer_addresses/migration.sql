-- CreateTable
CREATE TABLE "ConsumerAddress" (
    "id" TEXT NOT NULL,
    "consumer_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "address_line" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsumerAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsumerAddress_consumer_id_idx" ON "ConsumerAddress"("consumer_id");

-- AddForeignKey
ALTER TABLE "ConsumerAddress" ADD CONSTRAINT "ConsumerAddress_consumer_id_fkey" FOREIGN KEY ("consumer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
