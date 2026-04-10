import express from "express";
import {
  register,
  login,
  refresh,
  logout,
} from "../controllers/auth.controller.ts";
import {
  validate,
  registerSchema,
  loginSchema,
} from "../middleware/validate.middleware.ts";

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;
