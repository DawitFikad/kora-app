"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_controller_1 = require("../controllers/validation.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Only ADMIN, ORGANIZER, and dedicated SCANNER accounts can validate
const scannerAuth = [auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["ADMIN", "ORGANIZER", "SCANNER"])];
router.post("/scan", scannerAuth, validation_controller_1.ValidationController.scan);
router.post("/sync", scannerAuth, validation_controller_1.ValidationController.sync);
router.get("/gate-list/:eventId", scannerAuth, validation_controller_1.ValidationController.downloadSyncData);
exports.default = router;
