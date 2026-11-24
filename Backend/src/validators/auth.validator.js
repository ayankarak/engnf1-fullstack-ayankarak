import { z } from "zod";

const emailField = z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email")
    .max(254);

// `role` is deliberately absent: Zod strips unknown keys, so a client can never
// choose its own role through public registration.
const registerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must contain at least 2 characters")
        .max(50, "Name cannot exceed 50 characters"),

    email: emailField,

    password: z
        .string()
        .min(8, "Password must contain at least 8 characters")
        .max(72, "Password cannot exceed 72 characters"),
});

const loginSchema = z.object({
    email: emailField,

    password: z.string().min(1, "Password is required").max(72),
});

export default {
    registerSchema,
    loginSchema,
};
