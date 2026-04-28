-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
