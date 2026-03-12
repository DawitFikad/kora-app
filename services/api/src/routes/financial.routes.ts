import { Router } from "express";
import { FinancialController } from "../controllers/financial.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/rbac.middleware";
import { Role } from "@prisma/client";

const router = Router();

// Admin Dashboard
router.get("/dashboard", authenticate, authorize([Role.ADMIN]), FinancialController.getAdminDashboard);
router.get("/transactions", authenticate, authorize([Role.ADMIN]), FinancialController.listTransactions);
// GMV & Revenue (Admin)
router.get('/gmv', authenticate, authorize([Role.ADMIN]), FinancialController.getGMV);
router.get('/gmv/cities', authenticate, authorize([Role.ADMIN]), FinancialController.getGMVByCity);
router.get('/gmv/organizers', authenticate, authorize([Role.ADMIN]), FinancialController.getGMVByOrganizer);
router.get('/revenue', authenticate, authorize([Role.ADMIN]), FinancialController.getPlatformRevenue);
router.get('/payouts', authenticate, authorize([Role.ADMIN]), FinancialController.listPayouts);
router.get('/ledger', authenticate, authorize([Role.ADMIN]), FinancialController.getSettlementLedger);
router.get('/ledger/export', authenticate, authorize([Role.ADMIN]), FinancialController.exportLedgerCSV);
router.post('/settlements/release-completed', authenticate, authorize([Role.ADMIN]), FinancialController.releaseCompletedEventSettlements);
router.get('/settlement-accounts', authenticate, authorize([Role.ADMIN]), FinancialController.listSettlementAccounts);
router.post('/settlement-accounts', authenticate, authorize([Role.ADMIN]), FinancialController.createSettlementAccount);
router.get('/settlement-entries', authenticate, authorize([Role.ADMIN]), FinancialController.listSettlementEntries);
router.post('/settlement-entries', authenticate, authorize([Role.ADMIN]), FinancialController.recordSettlementEntry);
router.get('/reconciliation/runs', authenticate, authorize([Role.ADMIN]), FinancialController.listSettlementReconciliations);
router.post('/reconciliation/run', authenticate, authorize([Role.ADMIN]), FinancialController.runSettlementReconciliation);

// Organizer Wallet
router.get("/wallet", authenticate, authorize([Role.ORGANIZER]), FinancialController.getOrganizerWallet);

export default router;
