-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_holder" TEXT NOT NULL,
    "account_number_encrypted" TEXT NOT NULL,
    "ifsc_code" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_store_id_key" ON "BankAccount"("store_id");

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "PharmacyStore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
