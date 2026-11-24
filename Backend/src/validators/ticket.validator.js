const { z } = require("zod");

const ticketCategories = [
    "BILLING",
    "BUG",
    "FEATURE_REQUEST",
    "LOGIN",
    "DELIVERY",
];

const ticketPriorities = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "URGENT",
];

const ticketStatuses = [
    "OPEN",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSED",
];

const createTicketSchema = z.object({
    externalId: z.string().trim().min(1).max(100).optional(),

    subject: z
        .string()
        .trim()
        .min(1, "Subject is required")
        .max(150, "Subject cannot exceed 150 characters"),

    body: z
        .string()
        .trim()
        .min(1, "Ticket description is required"),

    priority: z.enum(ticketPriorities).optional(),

    category: z.enum(ticketCategories).optional(),
});

const updateTicketSchema = z.object({
    category: z.enum(ticketCategories).optional(),

    priority: z.enum(ticketPriorities).optional(),

    status: z.enum(ticketStatuses).optional(),

    assigneeId: z
        .number()
        .int()
        .positive()
        .nullable()
        .optional(),

    isReviewed: z.boolean().optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    {
        message: "At least one field is required for update",
    }
);

const ticketIdSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const ticketQuerySchema = z.object({
    status: z.enum(ticketStatuses).optional(),
    category: z.enum(ticketCategories).optional(),
    priority: z.enum(ticketPriorities).optional(),
    search: z.string().trim().max(200, "Search query cannot exceed 200 characters").optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    page: z.coerce.number().int().min(1).default(1),
});

const importTicketSchema = z.object({
    externalId: z.string().trim().min(1).max(100),
    subject: z.string().trim().min(1).max(150),
    body: z.string().trim().min(1),
});

module.exports = {
    createTicketSchema,
    updateTicketSchema,
    ticketIdSchema,
    ticketQuerySchema,
    importTicketSchema,
};
