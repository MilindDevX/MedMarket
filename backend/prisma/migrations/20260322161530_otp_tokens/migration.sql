-- CreateEnum
CREATE TYPE "Purpose" AS ENUM ('login', 'register', 'password_reset');

-- CreateTable
CREATE TABLE "otp_tokens" (
    "id" SERIAL NOT NULL,
    "mobile" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "purpose" "Purpose" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "otp_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_tokens_mobile_idx" ON "otp_tokens"("mobile");
