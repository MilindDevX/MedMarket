import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.ts";
import {
  validate,
  placeOrderSchema,
  updateOrderStatusSchema,
} from "../middleware/validate.middleware.ts";
import {
  placeOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  getPharmacyOrders,
  updateOrderStatus,
} from "../controllers/order.controller.ts";

const router = Router();


// ── Consumer routes ──
router.post("/",              authenticate, requireRole("consumer"), validate(placeOrderSchema), placeOrder);
router.get("/my",             authenticate, requireRole("consumer"), getMyOrders);
router.get("/my/:id",         authenticate, requireRole("consumer"), getOrder);
router.post("/my/:id/cancel", authenticate, requireRole("consumer"), cancelOrder);

// ── Pharmacy routes ──
router.get("/pharmacy",              authenticate, requireRole("pharmacy_owner"), getPharmacyOrders);
router.patch("/pharmacy/:id/status", authenticate, requireRole("pharmacy_owner"), validate(updateOrderStatusSchema), updateOrderStatus);

export default router;
