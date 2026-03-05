"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const test_routes_1 = __importDefault(require("./routes/test.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const event_routes_1 = __importDefault(require("./routes/event.routes"));
const ticketing_routes_1 = __importDefault(require("./routes/ticketing.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const validation_routes_1 = __importDefault(require("./routes/validation.routes"));
const financial_routes_1 = __importDefault(require("./routes/financial.routes"));
const payout_routes_1 = __importDefault(require("./routes/payout.routes"));
const security_routes_1 = __importDefault(require("./routes/security.routes"));
const organizer_routes_1 = __importDefault(require("./routes/organizer.routes"));
const refund_routes_1 = __importDefault(require("./routes/refund.routes"));
const dispute_routes_1 = __importDefault(require("./routes/dispute.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const content_routes_1 = __importDefault(require("./routes/content.routes"));
const booking_routes_1 = __importDefault(require("./routes/booking.routes"));
const staff_routes_1 = __importDefault(require("./routes/staff.routes"));
const support_routes_1 = __importDefault(require("./routes/support.routes"));
const public_routes_1 = __importDefault(require("./routes/public.routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
        req.rawBody = buf;
    },
}));
// TOP LEVEL DIAGNOSTICS - BEFORE ANY ROUTING
app.get("/api/health-check-v3", (req, res) => {
    res.json({
        status: "healthy",
        version: "3.0.0",
        env: {
            chapa: !!process.env.CHAPA_SECRET_KEY,
            telebirr: !!process.env.TELEBIRR_MERCHANT_APP_ID,
            node: process.env.NODE_ENV
        }
    });
});
// Root check
app.get("/", (req, res) => {
    res.json({
        message: "ET Ticket API",
        diagnostics: {
            chapa: !!process.env.CHAPA_SECRET_KEY
        }
    });
});
// Routes
const router = express_1.default.Router();
router.use("/auth", auth_routes_1.default);
router.use("/admin", admin_routes_1.default);
router.use("/profiles", profile_routes_1.default);
router.use("/events", event_routes_1.default);
router.use("/tickets", ticketing_routes_1.default);
router.use("/payments", payment_routes_1.default);
router.use("/validate", validation_routes_1.default);
router.use("/financials", financial_routes_1.default);
router.use("/payouts", payout_routes_1.default);
router.use("/security", security_routes_1.default);
router.use("/organizer", organizer_routes_1.default);
router.use("/refunds", refund_routes_1.default);
router.use("/disputes", dispute_routes_1.default);
router.use("/notifications", notification_routes_1.default);
router.use("/content", content_routes_1.default);
router.use("/booking", booking_routes_1.default);
router.use("/staff", staff_routes_1.default);
router.use("/support", support_routes_1.default);
router.use("/public", public_routes_1.default);
router.use("/", test_routes_1.default);
app.use("/api", router);
// Error handler
app.use(error_middleware_1.errorHandler);
exports.default = app;
