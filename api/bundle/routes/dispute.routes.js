"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dispute_controller_1 = require("../controllers/dispute.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// User can create a dispute
router.post("/", dispute_controller_1.DisputeController.createDispute);
// Admin can manage disputes
router.get("/", (0, auth_middleware_1.authorize)([client_1.Role.ADMIN]), dispute_controller_1.DisputeController.listDisputes);
router.patch("/:id", (0, auth_middleware_1.authorize)([client_1.Role.ADMIN]), dispute_controller_1.DisputeController.updateDispute);
exports.default = router;
