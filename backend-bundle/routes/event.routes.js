"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const event_controller_1 = require("../controllers/event.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Public Metadata
router.get("/meta", event_controller_1.EventController.getMetadata);
// Public Discovery (Optional Auth)
router.get("/", auth_middleware_1.optionalAuthenticate, event_controller_1.EventController.getAllEvents);
router.get("/:id", auth_middleware_1.optionalAuthenticate, event_controller_1.EventController.getEvent);
// Organizer Management
router.post("/", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ORGANIZER]), event_controller_1.EventController.createEvent);
router.put("/:id", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ORGANIZER]), event_controller_1.EventController.updateEvent);
// Admin Moderation
router.get("/admin/list", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), event_controller_1.EventController.listAllEvents);
router.post("/:id/review", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), event_controller_1.EventController.reviewEvent);
exports.default = router;
