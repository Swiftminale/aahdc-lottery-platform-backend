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
// const allowedOrigins = [
//   "http://localhost:3000", // For local development of your React frontend
//   "https://aahdc-lottery-platform.vercel.app/", // <-- REPLACE WITH YOUR ACTUAL FRONTEND VERCEL DOMAIN
//   "https://aahdc-lottery-platform-backend-swiftminale2482-tupvb4im.leapcell.dev", // This might be your backend domain itself, good to include
//   // Add any other domains where your frontend might be hosted in the future (e.g., custom domains)
// ];
// The PORT variable is not relevant for Vercel serverless functions,
// as Vercel handles the listening port automatically.

// =========================================================================
// CORS Configuration (Commented Out)
// This configures which origins are allowed to make requests to your backend.
// Adjust 'allowedOrigins' to include all domains your frontend will be served from.
// =========================================================================
/*
// Custom CORS configuration (commented out)
// const corsOptions = {
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//   credentials: true,
//   optionsSuccessStatus: 204,
// };
// app.use(cors(corsOptions));
*/

// =========================================================================
// Middleware
// =========================================================================
app.use(cors()); // Enable default CORS (allows all origins)
app.use(express.json()); // For parsing application/json requests (e.g., from frontend forms)

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
