import express from "express";
import helmet from "helmet";
import cors from "cors";
import env from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import ticketRoutes from "./routes/ticket.routes.js";
import userRoutes from "./routes/user.routes.js";
import errorHandler from "./middlewares/error.middleware.js";

const app = express();

// Security middleware
app.use(helmet());

// CORS: only the configured browser origins (CORS_ORIGIN)
app.use(cors({ origin: env.corsOrigins }));

// Parse incoming JSON requests
app.use(express.json({ limit: "1mb" }));

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
app.use("/api/users", userRoutes);

// Handle undefined routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
