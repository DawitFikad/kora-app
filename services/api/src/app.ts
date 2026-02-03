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
import { errorHandler } from "./middlewares/error.middleware";
import { errorHandler } from "./middlewares/error.middleware";
import { EventService } from "./services/event.service";
import { PaymentService } from "./services/payment.service";

const app = express();

// ----------------------------------------
// 🔹 VERCEL CRON ENDPOINTS
// ----------------------------------------
app.get("/api/cron/reminders", async (req, res) => {
  // Security check: Verify Vercel Signature or simply proceed if internal
  // For simplicity here, we assume Vercel secures crons or use a shared secret in headers
  try {
    console.log("[CRON] Running Event Reminders...");
    await EventService.sendReminders();
    res.json({ success: true, message: "Reminders sent" });
  } catch (error) {
    console.error("[CRON] Reminders Failed:", error);
    res.status(500).json({ success: false, error: "Failed to send reminders" });
  }
});

app.get("/api/cron/reconcile", async (req, res) => {
  try {
    console.log("[CRON] Running Payment Reconciliation...");
    await PaymentService.reconcileStuckPayments();
    res.json({ success: true, message: "Reconciliation complete" });
  } catch (error) {
    console.error("[CRON] Reconciliation Failed:", error);
    res.status(500).json({ success: false, error: "Failed to reconcile payments" });
  }
});

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000, // Limit each IP to 1000 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});

app.use(globalLimiter);

// Specific Rate Limiting for Auth/OTP
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10, // 10 OTP requests per hour per IP
  message: { error: "Too many login attempts. Please try again in an hour." }
});

// Specific Rate Limiting for Payments
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  limit: 20, // 20 payment attempts
  message: { error: "Payment frequency exceeded. Please wait before trying again." }
});

app.use("/api/auth/otp", authLimiter);
app.use("/api/payments/initialize", paymentLimiter);
app.use("/api/tickets/reserve", paymentLimiter);
app.use(cors());
app.use(express.json({
  limit: '10mb',
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/tickets", ticketingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/validate", validationRoutes);
app.use("/api/financials", financialRoutes);
app.use("/api/payouts", payoutRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/organizer", organizerRoutes);
app.use("/api/refunds", refundRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/support", supportRoutes);
app.use("/api", testRoutes);

app.get("/api", (req: any, res: any) => {
  res.json({ status: "API is running" });
});

export default app;
