import express from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import authRoutes from "./routes/auth.routes";
import testRoutes from "./routes/test.routes";
import adminRoutes from "./routes/admin.routes";
import profileRoutes from "./routes/profile.routes";
import eventRoutes from "./routes/event.routes";
import ticketingRoutes from "./routes/ticketing.routes";

const app = express();

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
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/tickets", ticketingRoutes);
app.use("/api", testRoutes);

app.get("/api", (req: any, res: any) => {
  res.json({ status: "API is running" });
});

export default app;
