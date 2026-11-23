
const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // Sequelize validation errors
    if (err.name === "SequelizeValidationError") {
        statusCode = 400;
        message = "Database validation failed";
    }

    // Duplicate entry errors
    if (err.name === "SequelizeUniqueConstraintError") {
        statusCode = 409;
        message = "A record with this value already exists";
    }

    // Foreign key constraint errors
    if (err.name === "SequelizeForeignKeyConstraintError") {
        statusCode = 400;
        message = "Invalid reference to another record";
    }

    if (process.env.NODE_ENV !== "production") {
        console.error(err);
    }

    return res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== "production" && {
            stack: err.stack,
        }),
    });
};

module.exports = errorHandler;
