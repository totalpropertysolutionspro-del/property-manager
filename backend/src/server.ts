import { app } from "./app.js";
import { initializeDatabase, backupDatabase } from "./db/index.js";

const PORT = process.env.PORT || 5001;

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

// Start server
app.listen(PORT, () => {
  console.log(`Property Manager API running on http://localhost:${PORT}`);
});
