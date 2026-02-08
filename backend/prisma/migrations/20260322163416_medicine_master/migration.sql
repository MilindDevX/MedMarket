-- CreateEnum
CREATE TYPE "MedicineForm" AS ENUM ('tablet', 'capsule', 'syrup', 'gel', 'powder', 'injection', 'drops', 'inhaler');

-- CreateEnum
CREATE TYPE "MedicineSchedule" AS ENUM ('otc', 'schedule_h', 'schedule_h1', 'schedule_x');

-- CreateTable
CREATE TABLE "MedicineMaster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "generic_name" TEXT NOT NULL,
    "salt_composition" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "form" "MedicineForm" NOT NULL,
    "pack_size" TEXT NOT NULL,
    "mrp" DECIMAL(65,30) NOT NULL,
    "schedule" "MedicineSchedule" NOT NULL DEFAULT 'otc',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineMaster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MedicineMaster_name_key" ON "MedicineMaster"("name");

-- AddForeignKey
ALTER TABLE "MedicineMaster" ADD CONSTRAINT "MedicineMaster_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
