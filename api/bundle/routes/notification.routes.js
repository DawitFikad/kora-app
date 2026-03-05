"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("../controllers/notification.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// User can view their notification history
router.get("/", notification_controller_1.NotificationController.getMyNotifications);
router.post("/mark-all-read", notification_controller_1.NotificationController.markAllAsRead);
router.patch("/:id/read", notification_controller_1.NotificationController.markAsRead);
router.delete("/:id", notification_controller_1.NotificationController.deleteNotification);
exports.default = router;
