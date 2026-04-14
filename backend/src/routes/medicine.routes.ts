import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.ts";
import { requireAdmin } from "../middleware/admin.middleware.ts";
import {
  validate,
  createMedicineSchema,
  updateMedicineSchema,
} from "../middleware/validate.middleware.ts";
import {
  listMedicines,
  createMedicine,
  getMedicine,
  deactivateMedicine,
  updateMedicine,
} from "../controllers/medicine.controller.ts";

const router = Router();

router.get("/",     listMedicines);
router.get("/:id",  getMedicine);
router.post("/",    authenticate, requireAdmin, validate(createMedicineSchema), createMedicine);
router.patch("/:id", authenticate, requireAdmin, validate(updateMedicineSchema), updateMedicine);
router.delete("/:id", authenticate, requireAdmin, deactivateMedicine);

export default router;
