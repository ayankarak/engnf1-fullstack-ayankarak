import env from "../config/env.js";

const isDevelopment = env.NODE_ENV === "development";

// MySQL SQLSTATE raised by the audit-immutability triggers.
const TRIGGER_SQLSTATE = "45000";

const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    let statusCode = err.statusCode || err.status || 500;
    let message = err.message || "Internal Server Error";
    let errors;

    if (err.name === "SequelizeValidationError") {
        statusCode = 400;
        message = "Validation failed";
        errors = err.errors?.map((e) => ({ field: e.path, message: e.message }));
    } else if (err.name === "SequelizeUniqueConstraintError") {
        statusCode = 409;
        message = "A record with this value already exists";
    } else if (err.name === "SequelizeForeignKeyConstraintError") {
        statusCode = 400;
        message = "Invalid reference to another record";
    } else if (err.parent?.sqlState === TRIGGER_SQLSTATE) {
        statusCode = 405;
        message = "Audit events are immutable and cannot be modified or deleted";
    }

    if (Array.isArray(err.errors) && err.errors.length > 0 && !errors) {
        errors = err.errors;
    }

    if (statusCode >= 500) {
        console.error(err);

        // Never leak internals of unexpected errors.
        if (!isDevelopment) message = "Internal Server Error";
    }

    return res.status(statusCode).json({
        success: false,
        message,
        ...(errors && { errors }),
        ...(isDevelopment && statusCode >= 500 && { stack: err.stack }),
    });
};

export default errorHandler;
