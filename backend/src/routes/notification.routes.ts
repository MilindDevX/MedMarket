import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.ts";
import { getNotifications, markRead, markAllRead, deleteNotification, deleteAllNotifications } from "../controllers/notification.controller.ts";

const router = Router();

router.get("/",              authenticate, getNotifications);
router.patch("/read-all",    authenticate, markAllRead);
router.patch("/:id/read",    authenticate, markRead);
router.delete("/",           authenticate, deleteAllNotifications);
router.delete("/:id",        authenticate, deleteNotification);

export default router;
