import { Router } from "express";
import { FinancialController } from "../controllers/financial.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/rbac.middleware";
import { Role } from "@prisma/client";

const router = Router();

// Admin Dashboard
router.get("/dashboard", authenticate, authorize([Role.ADMIN]), FinancialController.getAdminDashboard);
router.get("/transactions", authenticate, authorize([Role.ADMIN]), FinancialController.listTransactions);

// Organizer Wallet
router.get("/wallet", authenticate, authorize([Role.ORGANIZER]), FinancialController.getOrganizerWallet);

export default router;
