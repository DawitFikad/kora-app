"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const support_controller_1 = require("../controllers/support.controller");
const express_rate_limit_1 = require("express-rate-limit");
const router = (0, express_1.Router)();
// Specific rate limit for contact form to prevent spam
const contactLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 5, // 5 messages per hour
    message: { error: "Too many messages. Please try again later." }
});
router.post("/contact", contactLimiter, support_controller_1.SupportController.handleSubmit);
exports.default = router;
