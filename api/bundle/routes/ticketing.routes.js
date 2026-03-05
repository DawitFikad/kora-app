"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ticketing_controller_1 = require("../controllers/ticketing.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// All ticketing routes require authentication
router.use(auth_middleware_1.authenticate);
router.post("/reserve", ticketing_controller_1.TicketingController.reserve);
router.get("/me", ticketing_controller_1.TicketingController.getMyTickets);
// Admin Only
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const client_1 = require("@prisma/client");
router.post("/:ticketId/invalidate", (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), ticketing_controller_1.TicketingController.invalidate);
exports.default = router;
