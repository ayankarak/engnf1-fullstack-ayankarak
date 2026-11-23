const express = require("express");

const ticketController = require("../controllers/ticket.controller");

const authenticate = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");

const { createTicketSchema, updateTicketSchema, ticketIdSchema, ticketQuerySchema,importTicketSchema, } = require("../validators/ticket.validator");

const router = express.Router();

// All ticket routes require authentication
router.use(authenticate);

// GET /api/tickets
router.get("/", validate(ticketQuerySchema, "query"), ticketController.getAll );

// POST /api/tickets
router.post( "/", validate(createTicketSchema), ticketController.create );

// POST /api/tickets/import
router.post( "/import", validate(importTicketSchema), ticketController.importTicket );

// GET /api/tickets/:id
router.get("/:id", validate(ticketIdSchema, "params"), ticketController.getById );

// PATCH /api/tickets/:id
// Only ADMIN can update tickets
router.patch( "/:id", authorize("ADMIN"), validate(ticketIdSchema, "params"), validate(updateTicketSchema), ticketController.update );

// DELETE /api/tickets/:id
// Only ADMIN can delete tickets
router.delete( "/:id", authorize("ADMIN"), validate(ticketIdSchema, "params"), ticketController.delete );

module.exports = router;