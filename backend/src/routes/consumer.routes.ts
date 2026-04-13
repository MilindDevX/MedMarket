import express from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.ts";
import { validate, fileComplaintSchema } from "../middleware/validate.middleware.ts";
import { fileComplaint, updateProfile } from "../controllers/consumer.controller.ts";

const router = express.Router();

// FIX 21: Added validate(fileComplaintSchema) to the complaints endpoint.
// Previously any payload was accepted, including empty bodies.
router.post("/complaints", authenticate, requireRole("consumer"), validate(fileComplaintSchema), fileComplaint);
router.patch("/profile",   authenticate, requireRole("consumer"), updateProfile);

export default router;
