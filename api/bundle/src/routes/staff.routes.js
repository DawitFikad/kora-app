"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const staff_controller_1 = require("../controllers/staff.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Public-ish / Logged in users: Accept invite
router.post("/accept", staff_controller_1.StaffController.acceptInvite);
// Organizer Only: Manage staff
router.use((0, auth_middleware_1.authorize)([client_1.Role.ORGANIZER]));
router.get("/", staff_controller_1.StaffController.listMyStaff);
router.post("/invite", staff_controller_1.StaffController.inviteManual);
router.delete("/:id", staff_controller_1.StaffController.removeStaff);
exports.default = router;
