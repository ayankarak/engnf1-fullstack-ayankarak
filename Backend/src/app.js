
require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const ticketRoutes = require("./routes/ticket.routes");

const errorHandler = require("./middlewares/error.middleware");

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors());

// Parse incoming JSON requests
app.use(express.json({ limit: "10mb" }));

// Parse URL-encoded requests
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to TriageSync API",
        status: "Server is running",
    });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);

// Handle undefined routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
