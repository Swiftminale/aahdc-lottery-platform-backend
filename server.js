// backend/server.js
import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file

import express from "express";
import cors from "cors";
import db from "./src/database/index.js";

// Import routes
import unitRoutes from "./src/routes/unitRoutes.js";
import allocationRoutes from "./src/routes/allocationRoutes.js";
import reportRoutes from "./src/routes/reportRoutes.js";

const app = express();
const cors = require("cors");
// =========================================================================
// =========================================================================
// Middleware
// =========================================================================
app.use(
  cors({
    origin: "https://aahdc-lottery-platform.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
// =========================================================================
// API Routes
// =========================================================================
app.use("/api/units", unitRoutes);
app.use("/api/allocation", allocationRoutes);
app.use("/api/reports", reportRoutes);

app.get("/", (_, res) => {
  res.send("AAHDC Lottery Platform Backend API is running!");
});

db.sequelize
  .sync({ force: false }) // `force: false` ensures tables are not dropped if they exist
  .then(() => {
    console.log("Database synced successfully with Neon PostgreSQL.");
  })
  .catch((err) => {
    console.error("Unable to sync database:", err);
  });
export default app;
module.exports = app;
