"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profile_controller_1 = require("../controllers/profile.controller");
const saved_payment_controller_1 = require("../controllers/saved-payment.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// User Profiles (Available to all authenticated users)
router.get("/me", auth_middleware_1.authenticate, profile_controller_1.ProfileController.getMyProfile);
router.patch("/me", auth_middleware_1.authenticate, profile_controller_1.ProfileController.updateMyProfile);
// Saved Payment Methods
router.get("/payment-methods", auth_middleware_1.authenticate, saved_payment_controller_1.SavedPaymentController.getMyMethods);
router.post("/payment-methods", auth_middleware_1.authenticate, saved_payment_controller_1.SavedPaymentController.addMethod);
router.delete("/payment-methods/:id", auth_middleware_1.authenticate, saved_payment_controller_1.SavedPaymentController.deleteMethod);
router.patch("/payment-methods/:id/default", auth_middleware_1.authenticate, saved_payment_controller_1.SavedPaymentController.setDefault);
// Organizer Profiles (Organizer Only)
router.get("/organizer", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ORGANIZER, client_1.Role.ADMIN]), profile_controller_1.ProfileController.getMyOrganizerProfile);
router.patch("/organizer", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ORGANIZER]), profile_controller_1.ProfileController.updateMyOrganizerProfile);
// Admin Actions
router.get("/admin/organizers", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), profile_controller_1.ProfileController.listOrganizers);
router.post("/admin/organizers/:id/review", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), profile_controller_1.ProfileController.reviewOrganizer);
exports.default = router;
