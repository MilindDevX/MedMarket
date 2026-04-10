import { Router } from "express";
import {
  listApplications,
  getApplication,
  approveApplication,
  rejectApplicaton,
  listUsers,
  toggleUserActive,
  suspendApplication,
  getAllOrders,
  listComplaints,
  updateComplaint,
} from "../controllers/admin.controller.ts";
import { authenticate } from "../middleware/auth.middleware.ts";
import { requireAdmin } from "../middleware/admin.middleware.ts";

const router = Router();

router.get("/applications", authenticate, requireAdmin, listApplications);
router.get("/applications/:id", authenticate, requireAdmin, getApplication);
router.patch(
  "/applications/:id/approve",
  authenticate,
  requireAdmin,
  approveApplication,
);
router.patch(
  "/applications/:id/reject",
  authenticate,
  requireAdmin,
  rejectApplicaton,
);
router.get("/users", authenticate, requireAdmin, listUsers);
router.patch("/users/:id/toggle", authenticate, requireAdmin, toggleUserActive);
router.patch(
  "/applications/:id/suspend",
  authenticate,
  requireAdmin,
  suspendApplication,
);
router.get("/orders", authenticate, requireAdmin, getAllOrders);
router.get("/users", authenticate, requireAdmin, listUsers);
router.patch("/users/:id/toggle", authenticate, requireAdmin, toggleUserActive);
router.get("/complaints", authenticate, requireAdmin, listComplaints);
router.patch("/complaints/:id", authenticate, requireAdmin, updateComplaint);

export default router;
