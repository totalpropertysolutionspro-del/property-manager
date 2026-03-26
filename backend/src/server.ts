import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeDatabase, backupDatabase } from "./db/index.js";
import propertiesRouter from "./routes/properties.js";
import tenantsRouter from "./routes/tenants.js";
import workOrdersRouter from "./routes/workorders.js";
import invoicesRouter from "./routes/invoices.js";
import staffRouter from "./routes/staff.js";
import notificationsRouter from "./routes/notifications.js";
import contactsRouter from "./routes/contacts.js";
import vendorsRouter from "./routes/vendors.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
}));
app.use(express.json());

// Initialize database on startup
(async () => {
  try {
    await initializeDatabase();
    await backupDatabase();
    console.log("Database ready");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
})();

// Routes
app.use("/api/properties", propertiesRouter);
app.use("/api/tenants", tenantsRouter);
app.use("/api/work-orders", workOrdersRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/staff", staffRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/contacts", contactsRouter);
app.use("/api/vendors", vendorsRouter);

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

// Start server
app.listen(PORT, () => {
  console.log(`Property Manager API running on http://localhost:${PORT}`);
});
