import express from "express";
import cors from "cors";
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

const app = express();

app.use(cors());
app.use(express.json({
  limit: '10mb',
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

// 🚨 PRIORITY DIAGNOSTICS - VERSION 3.3.1 - MUST BE BEFORE ANY ROUTER
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    version: "3.3.1",
    diagnostics: {
      chapaSecret: !!process.env.CHAPA_SECRET_KEY,
      chapaKeyLength: process.env.CHAPA_SECRET_KEY?.length || 0,
      telebirrId: !!process.env.TELEBIRR_MERCHANT_APP_ID,
      apiUrl: process.env.API_URL || "not set",
      nodeEnv: process.env.NODE_ENV
    }
  });
});

app.get("/api", (req, res) => {
  res.json({
    status: "API is running v3.3.1",
    config: {
      chapa: !!process.env.CHAPA_SECRET_KEY,
      telebirr: !!process.env.TELEBIRR_MERCHANT_APP_ID
    }
  });
});

// App Routes
const apiRouter = express.Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/admin", adminRoutes);
apiRouter.use("/profiles", profileRoutes);
apiRouter.use("/events", eventRoutes);
apiRouter.use("/tickets", ticketingRoutes);
apiRouter.use("/payments", paymentRoutes);
apiRouter.use("/validate", validationRoutes);
apiRouter.use("/financials", financialRoutes);
apiRouter.use("/payouts", payoutRoutes);
apiRouter.use("/security", securityRoutes);
apiRouter.use("/organizer", organizerRoutes);
apiRouter.use("/refunds", refundRoutes);
apiRouter.use("/disputes", disputeRoutes);
apiRouter.use("/notifications", notificationRoutes);
apiRouter.use("/content", contentRoutes);
apiRouter.use("/booking", bookingRoutes);
apiRouter.use("/staff", staffRoutes);
apiRouter.use("/support", supportRoutes);
apiRouter.use("/public", publicRoutes);
apiRouter.use("/test", testRoutes); // Note: changed from "/" to "/test" to avoid overlap

app.use("/api", apiRouter);

// Root check
app.get("/", (req, res) => {
  res.json({ message: "Welcome to ET Ticket API v3.3.1" });
});

// Error handling
app.use(errorHandler);

export default app;
