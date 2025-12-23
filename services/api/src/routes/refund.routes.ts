import { Router } from "express";
import { RefundController } from "../controllers/refund.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate);

// User-facing refund request
router.post("/request", RefundController.requestRefund);

// Admin-facing refund management
router.get("/", authorize([Role.ADMIN]), RefundController.listRefunds);
router.post("/:id/approve", authorize([Role.ADMIN]), RefundController.approveRefund);
router.post("/:id/reject", authorize([Role.ADMIN]), RefundController.rejectRefund);

export default router;
