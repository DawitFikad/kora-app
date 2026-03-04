import express from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import authRoutes from "./routes/auth.routes";
import testRoutes from "./routes/test.routes";
import adminRoutes from "./routes/admin.routes";
import profileRoutes from "./routes/profile.routes";
import eventRoutes from "./routes/event.routes";
import ticketingRoutes from "./routes/ticketing.routes";
import paymentRoutes from "./routes/payment.routes";
import validationRoutes from "./routes/validation.routes";
import financialRoutes from "./routes/financial.routes";
import payoutRoutes from "./routes/payout.routes";
import securityRoutes from "./routes/security.routes";
import organizerRoutes from "./routes/organizer.routes";
import refundRoutes from "./routes/refund.routes";
import disputeRoutes from "./routes/dispute.routes";
import notificationRoutes from "./routes/notification.routes";
import contentRoutes from "./routes/content.routes";
import bookingRoutes from "./routes/booking.routes";
import staffRoutes from "./routes/staff.routes";
import supportRoutes from "./routes/support.routes";
import publicRoutes from "./routes/public.routes";
import { errorHandler } from "./middlewares/error.middleware";
import { EventService } from "./services/event.service";
import { PaymentService } from "./services/payment.service";

// Extend IncomingMessage to include rawBody
import type { IncomingMessage } from "http";

declare module "http" {
  interface IncomingMessage {
    rawBody?: Buffer;
  }
}

const app = express();

app.use(cors());
app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// TOP LEVEL DIAGNOSTICS - BEFORE ANY ROUTING
app.get("/api/health-check-v3", (req, res) => {
  res.json({
    status: "healthy",
    version: "3.12.0",
    service: "ET-Ticket API Core",
    timestamp: new Date().toISOString(),
    env: {
      chapa: !!process.env.CHAPA_SECRET_KEY,
      telebirr: !!process.env.TELEBIRR_MERCHANT_APP_ID,
      supabase: !!process.env.DATABASE_URL?.includes('supabase'),
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
const router = express.Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/profiles", profileRoutes);
router.use("/events", eventRoutes);
router.use("/tickets", ticketingRoutes);
router.use("/payments", paymentRoutes);
router.use("/validate", validationRoutes);
router.use("/financials", financialRoutes);
router.use("/payouts", payoutRoutes);
router.use("/security", securityRoutes);
router.use("/organizer", organizerRoutes);
router.use("/refunds", refundRoutes);
router.use("/disputes", disputeRoutes);
router.use("/notifications", notificationRoutes);
router.use("/content", contentRoutes);
router.use("/booking", bookingRoutes);
router.use("/staff", staffRoutes);
router.use("/support", supportRoutes);
router.use("/public", publicRoutes);
router.use("/", testRoutes);

app.use("/api", router);

// Error handler
app.use(errorHandler);

export default app;
