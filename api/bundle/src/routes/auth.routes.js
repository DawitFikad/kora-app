"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = require("express-rate-limit");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_config_1 = require("../config/upload.config");
const authLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    limit: 500, // Increased for development/testing
    message: { error: "Too many authentication attempts, please try again in 15 minutes." }
});
const router = (0, express_1.Router)();
router.post("/otp/request", authLimiter, auth_controller_1.AuthController.requestOtp);
router.post("/otp/verify", authLimiter, auth_controller_1.AuthController.verifyOtp);
router.post("/refresh", auth_controller_1.AuthController.refreshToken);
router.post("/organizer/register", upload_config_1.upload.any(), auth_controller_1.AuthController.registerOrganizer);
router.get("/me", auth_middleware_1.authenticate, auth_controller_1.AuthController.getMe);
exports.default = router;
