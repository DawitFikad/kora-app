import { Router } from "express";
import { PayoutController } from "../controllers/payout.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/rbac.middleware";
import { Role } from "@prisma/client";

const router = Router();

// Organizer: Request and View Payouts
router.post("/request", authenticate, authorize([Role.ORGANIZER]), PayoutController.requestPayout);
router.get("/my", authenticate, authorize([Role.ORGANIZER]), PayoutController.getMyPayouts);

// Admin: Manage Payouts
router.get("/pending", authenticate, authorize([Role.ADMIN]), PayoutController.listPendingPayouts);
router.post("/:batchId/approve", authenticate, authorize([Role.ADMIN]), PayoutController.approvePayout);

export default router;
