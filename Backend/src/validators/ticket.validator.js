import { z } from "zod";
import constants from "../utils/constants.js";

const {
    TICKET_CATEGORIES,
    TICKET_PRIORITIES,
    TICKET_STATUSES,
} = constants;

const subjectField = z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(150, "Subject cannot exceed 150 characters");

const bodyField = z
    .string()
    .trim()
    .min(1, "Ticket description is required")
    .max(20000, "Ticket description cannot exceed 20000 characters");

const externalIdField = z
    .string()
    .trim()
    .min(1, "External ID cannot be empty")
    .max(100, "External ID cannot exceed 100 characters");

// Category and priority are always derived by the classifier; clients cannot supply them
// on create/import (unknown keys are stripped by Zod).
const createTicketSchema = z.object({
    externalId: externalIdField.optional(),
    subject: subjectField,
    body: bodyField,
});

const importTicketSchema = z.object({
    externalId: externalIdField,
    subject: subjectField,
    body: bodyField,
});

const updateTicketSchema = z
    .object({
        category: z.enum(TICKET_CATEGORIES).optional(),
        priority: z.enum(TICKET_PRIORITIES).optional(),
        status: z.enum(TICKET_STATUSES).optional(),
        assigneeId: z.number().int().positive().nullable().optional(),
        isReviewed: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field is required for update",
    });

const ticketIdSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const ticketQuerySchema = z.object({
    status: z.enum(TICKET_STATUSES).optional(),
    category: z.enum(TICKET_CATEGORIES).optional(),
    priority: z.enum(TICKET_PRIORITIES).optional(),
    assigneeId: z.coerce.number().int().positive().optional(),

    // Literal substring search over subject and body.
    q: z
        .string()
        .trim()
        .max(100, "Search query cannot exceed 100 characters")
        .transform((value) => (value === "" ? undefined : value))
        .optional(),

    sortBy: z.enum(["createdAt", "updatedAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),

    limit: z.coerce.number().int().min(1).max(100).default(10),
    page: z.coerce.number().int().min(1).default(1),
});

export default {
    createTicketSchema,
    importTicketSchema,
    updateTicketSchema,
    ticketIdSchema,
    ticketQuerySchema,
};
