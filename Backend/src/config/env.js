import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(5000),

    DB_HOST: z.string().min(1, "is required"),
    DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
    DB_USER: z.string().min(1, "is required"),
    DB_PASSWORD: z.string().default(""),
    DB_NAME: z.string().min(1, "is required"),

    JWT_SECRET: z.string().min(32, "must be at least 32 characters long"),
    JWT_EXPIRES_IN: z.string().min(1).default("24h"),

    // Comma-separated list of allowed browser origins.
    CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    // Only variable names and reasons are printed, never their values.
    const details = parsed.error.issues
        .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
        .join("\n");

    throw new Error(
        `Invalid environment configuration. Check your .env file (see .env.example):\n${details}`
    );
}

export default Object.freeze({
    ...parsed.data,
    corsOrigins: parsed.data.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean),
});
