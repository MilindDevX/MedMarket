-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "consumer_id" TEXT NOT NULL,
    "order_id" TEXT,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_consumer_id_fkey" FOREIGN KEY ("consumer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
