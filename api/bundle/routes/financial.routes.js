"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const financial_controller_1 = require("../controllers/financial.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Admin Dashboard
router.get("/dashboard", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), financial_controller_1.FinancialController.getAdminDashboard);
router.get("/transactions", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), financial_controller_1.FinancialController.listTransactions);
// GMV & Revenue (Admin)
router.get('/gmv', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), financial_controller_1.FinancialController.getGMV);
router.get('/gmv/cities', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), financial_controller_1.FinancialController.getGMVByCity);
router.get('/gmv/organizers', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), financial_controller_1.FinancialController.getGMVByOrganizer);
router.get('/revenue', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), financial_controller_1.FinancialController.getPlatformRevenue);
router.get('/payouts', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), financial_controller_1.FinancialController.listPayouts);
router.get('/ledger', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), financial_controller_1.FinancialController.getSettlementLedger);
router.get('/ledger/export', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), financial_controller_1.FinancialController.exportLedgerCSV);
// Organizer Wallet
router.get("/wallet", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ORGANIZER]), financial_controller_1.FinancialController.getOrganizerWallet);
exports.default = router;
