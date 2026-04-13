import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.ts";
import {
  validate,
  addAddressSchema,
  updateAddressSchema,
} from "../middleware/validate.middleware.ts";
import {
  addAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
} from "../controllers/address.controller.ts";

const router = Router();

// FIX 20: Added Zod validation to POST and PATCH address routes.
// Previously any string (including invalid pincodes) was accepted.
router.get("/",              authenticate, getAddresses);
router.post("/",             authenticate, validate(addAddressSchema), addAddress);
router.patch("/:id",         authenticate, validate(updateAddressSchema), updateAddress);
router.delete("/:id",        authenticate, deleteAddress);
router.patch("/:id/default", authenticate, setDefaultAddress);

export default router;
