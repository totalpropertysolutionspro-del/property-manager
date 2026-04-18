import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";
import propertiesRouter from "./routes/properties.js";
import tenantsRouter from "./routes/tenants.js";
import workOrdersRouter from "./routes/workorders.js";
import invoicesRouter from "./routes/invoices.js";
import staffRouter from "./routes/staff.js";
import notificationsRouter from "./routes/notifications.js";
import contactsRouter from "./routes/contacts.js";
import vendorsRouter from "./routes/vendors.js";
import incidentsRouter from "./routes/incidents.js";
import squareRouter from "./routes/square.js";
import remindersRouter from "./routes/reminders.js";
import filesRouter from "./routes/files.js";
import messagesRouter from "./routes/messages.js";
import { requireAuth } from "./middleware/auth.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
}));
app.use(express.json());

// Auth routes — public (no auth required)
app.use("/api/auth", authRouter);

// Protect all other /api/* routes
app.use("/api", (req, res, next) => {
  // Skip OPTIONS preflight
  if (req.method === "OPTIONS") return next();
  return requireAuth(req as any, res, next);
});

// Protected routes
app.use("/api/properties", propertiesRouter);
app.use("/api/tenants", tenantsRouter);
app.use("/api/work-orders", workOrdersRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/staff", staffRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/contacts", contactsRouter);
app.use("/api/vendors", vendorsRouter);
app.use("/api/incidents", incidentsRouter);
app.use("/api/square", squareRouter);
app.use("/api/reminders", remindersRouter);
app.use("/api/files", filesRouter);
app.use("/api/tickets", workOrdersRouter);
app.use("/api/messages", messagesRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

export { app };
