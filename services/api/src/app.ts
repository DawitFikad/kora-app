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
import { errorHandler } from "./middlewares/error.middleware";
import cron from "node-cron";
import { EventService } from "./services/event.service";

const app = express();

// Scheduler: Send Event Reminders every hour
cron.schedule("0 * * * *", async () => {
  console.log("[SCHEDULER] Running Event Reminders...");
  await EventService.sendReminders();
});

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});

app.use(globalLimiter);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
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
app.use("/api", testRoutes);

app.get("/api", (req: any, res: any) => {
  res.json({ status: "API is running" });
});

export default app;
