// backend/server.js
require("dotenv").config(); // Load environment variables from .env file

const express = require("express");
const cors = require("cors");
const db = require("./src/database");

// Import routes
const unitRoutes = require("./src/routes/unitRoutes");
const allocationRoutes = require("./src/routes/allocationRoutes");
const reportRoutes = require("./src/routes/reportRoutes");

const app = express();
// The PORT variable is not relevant for Vercel serverless functions,
// as Vercel handles the listening port automatically.

// =========================================================================
// CORS Configuration
// This configures which origins are allowed to make requests to your backend.
// Adjust 'allowedOrigins' to include all domains your frontend will be served from.
// =========================================================================
const allowedOrigins = [
  "http://localhost:3000", // For local development of your React frontend
  "https://aahdc-lottery-platform.vercel.app", // <-- REPLACE WITH YOUR ACTUAL FRONTEND VERCEL DOMAIN
  "https://aahdc-lottery.vercel.app", // This might be your backend domain itself, good to include
  // Add any other domains where your frontend might be hosted in the future (e.g., custom domains)
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or same-origin requests)
    // or if the origin is in our allowed list.
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true); // Allow the request
    } else {
      callback(new Error("Not allowed by CORS")); // Block the request
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Specify the HTTP methods allowed
  credentials: true, // Allow cookies to be sent with cross-origin requests (if you use sessions/cookies)
  optionsSuccessStatus: 204, // For preflight requests, respond with 204 No Content
};

// Use the CORS middleware with the defined options
app.use(cors(corsOptions));

// =========================================================================
// Middleware
// =========================================================================
app.use(express.json()); // For parsing application/json requests (e.g., from frontend forms)

// =========================================================================
// API Routes
// =========================================================================
app.use("/api/units", unitRoutes);
app.use("/api/allocation", allocationRoutes);
app.use("/api/reports", reportRoutes);

// Optional: A simple root route to confirm the backend is running
app.get("/", (req, res) => {
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

module.exports = app;
