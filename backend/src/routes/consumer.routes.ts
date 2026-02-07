import express from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.ts";
import { validate, fileComplaintSchema } from "../middleware/validate.middleware.ts";
import { fileComplaint, getMyComplaints, updateProfile } from "../controllers/consumer.controller.ts";

const router = express.Router();

router.post("/complaints",  authenticate, requireRole("consumer"), validate(fileComplaintSchema), fileComplaint);
router.get("/complaints",   authenticate, requireRole("consumer"), getMyComplaints);
router.patch("/profile",    authenticate, requireRole("consumer"), updateProfile);

export default router;
