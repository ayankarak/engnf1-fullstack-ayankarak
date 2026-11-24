import express from "express";
import ticketController from "../controllers/ticket.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/role.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import constants from "../utils/constants.js";
import ticketValidator from "../validators/ticket.validator.js";

const { ROLES } = constants;

const {
    createTicketSchema,
    updateTicketSchema,
    ticketIdSchema,
    ticketQuerySchema,
    importTicketSchema,
} = ticketValidator;

const router = express.Router();

// Roles: USER = read only, AGENT = triage (create/import/update), ADMIN = + delete.
const canTriage = authorize(ROLES.AGENT, ROLES.ADMIN);

// All ticket routes require authentication
router.use(authenticate);

// GET /api/tickets
router.get("/", validate(ticketQuerySchema, "query"), ticketController.getAll);

// GET /api/tickets/stats  (must be declared before "/:id")
router.get("/stats", ticketController.getStats);

// POST /api/tickets
router.post("/", canTriage, validate(createTicketSchema), ticketController.create);

// POST /api/tickets/import
router.post("/import", canTriage, validate(importTicketSchema), ticketController.importTicket);

// GET /api/tickets/:id
router.get("/:id", validate(ticketIdSchema, "params"), ticketController.getById);

// GET /api/tickets/:id/events  (read-only audit trail; no write routes exist for events)
router.get("/:id/events", validate(ticketIdSchema, "params"), ticketController.getEvents);

// PATCH /api/tickets/:id
router.patch(
    "/:id",
    canTriage,
    validate(ticketIdSchema, "params"),
    validate(updateTicketSchema),
    ticketController.update
);

// DELETE /api/tickets/:id  (soft delete, ADMIN only)
router.delete(
    "/:id",
    authorize(ROLES.ADMIN),
    validate(ticketIdSchema, "params"),
    ticketController.delete
);

export default router;
