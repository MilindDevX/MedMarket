import { Router } from "express";
import {
  listApplications, getApplication, approveApplication, reactivateApplication,
  rejectApplicaton, listUsers, toggleUserActive, suspendApplication,
  updatePharmacyDetails, getAllOrders, listComplaints, updateComplaint,
  getPharmacyAnalytics,
} from "../controllers/admin.controller.ts";
import { getDashboard }              from "../controllers/dashboard.controller.ts";
import { getSettings, updateSettings } from "../controllers/settings.controller.ts";
import { authenticate }              from "../middleware/auth.middleware.ts";
import { requireAdmin }              from "../middleware/admin.middleware.ts";

const router = Router();

// ── Dashboard ──
router.get("/dashboard",                  authenticate, requireAdmin, getDashboard);

// ── Platform Settings ──
router.get("/settings",                   authenticate, requireAdmin, getSettings);
router.patch("/settings",                 authenticate, requireAdmin, updateSettings);

// ── Pharmacy Applications ──
router.get("/applications",               authenticate, requireAdmin, listApplications);
router.get("/applications/:id",           authenticate, requireAdmin, getApplication);
router.patch("/applications/:id/approve",    authenticate, requireAdmin, approveApplication);
router.patch("/applications/:id/reactivate", authenticate, requireAdmin, reactivateApplication);
router.patch("/applications/:id/reject",     authenticate, requireAdmin, rejectApplicaton);
router.patch("/applications/:id/suspend",    authenticate, requireAdmin, suspendApplication);
router.patch("/applications/:id",            authenticate, requireAdmin, updatePharmacyDetails);

// ── Users ──
router.get("/users",                      authenticate, requireAdmin, listUsers);
router.patch("/users/:id/toggle",         authenticate, requireAdmin, toggleUserActive);

// ── Orders ──
router.get("/orders",                     authenticate, requireAdmin, getAllOrders);

// ── Pharmacy Analytics ──
router.get("/analytics/pharmacy/:id",     authenticate, requireAdmin, getPharmacyAnalytics);

// ── Complaints ──
router.get("/complaints",                 authenticate, requireAdmin, listComplaints);
router.patch("/complaints/:id",           authenticate, requireAdmin, updateComplaint);

export default router;
