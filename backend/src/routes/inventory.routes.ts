import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.ts";
import {
  validate,
  addInventorySchema,
  updateInventorySchema,
} from "../middleware/validate.middleware.ts";
import {
  addInventory,
  deleteInventory,
  getExpiryAlerts,
  getInventory,
  updateInventory,
} from "../controllers/inventory.controller.ts";

const router = Router();

// All inventory routes require an authenticated, approved pharmacy owner.
// FIX 14: Added requireRole('pharmacy_owner') to every route — previously
// any authenticated user (consumer, admin) could read or mutate inventory.
// FIX 15: Added validate(updateInventorySchema) to PATCH — previously there
// was no validation on updates so arbitrary data could be written.
router.get("/expiry-alerts", authenticate, requireRole("pharmacy_owner"), getExpiryAlerts);
router.get("/",              authenticate, requireRole("pharmacy_owner"), getInventory);
router.post("/",             authenticate, requireRole("pharmacy_owner"), validate(addInventorySchema), addInventory);
router.patch("/:id",         authenticate, requireRole("pharmacy_owner"), validate(updateInventorySchema), updateInventory);
router.delete("/:id",        authenticate, requireRole("pharmacy_owner"), deleteInventory);

export default router;
