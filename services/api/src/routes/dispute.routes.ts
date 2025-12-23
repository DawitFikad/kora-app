import { Router } from "express";
import { DisputeController } from "../controllers/dispute.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate);

// User can create a dispute
router.post("/", DisputeController.createDispute);

// Admin can manage disputes
router.get("/", authorize([Role.ADMIN]), DisputeController.listDisputes);
router.patch("/:id", authorize([Role.ADMIN]), DisputeController.updateDispute);

export default router;
