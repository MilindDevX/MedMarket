import { Router } from "express";
import { getStoreById, getStores } from "../controllers/store.controller.ts";

const router = Router();

router.get("/", getStores);
router.get("/:id", getStoreById);

export default router;
