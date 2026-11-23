const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

app.use(helmet());
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to TriageSync API",
    });
});

app.use((req, res) => {
    res.status(404).json({
        error: {
            code: "NOT_FOUND",
            message: "Route not found",
        },
    });
});

app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.statusCode || 500).json({
        error: {
            code: err.code || "INTERNAL_SERVER_ERROR",
            message: err.message || "Internal server error",
        },
    });
});

module.exports = app;