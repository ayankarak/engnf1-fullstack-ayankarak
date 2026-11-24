
const ticketService = require("../services/ticket.service");
const { toTicketDTO } = require("../dto/ticket.dto");

class TicketController {
    // POST /api/tickets
    async create(req, res, next) {
        try {
            const ticket = await ticketService.createTicket(
                req.validated.body
            );

            return res.status(201).json({
                success: true,
                message: "Ticket created successfully",
                data: {
                    ticket: toTicketDTO(ticket),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    // POST /api/tickets/import
    async importTicket(req, res, next) {
        try {
            const ticket = await ticketService.importTicket(
                req.validated.body
            );

            return res.status(200).json({
                success: true,
                message: "Ticket imported successfully",
                data: {
                    ticket: toTicketDTO(ticket),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/tickets
    async getAll(req, res, next) {
        try {
            const result = await ticketService.getAllTickets(
                req.validated.query
            );

            return res.status(200).json({
                success: true,
                message: "Tickets fetched successfully",
                data: {
                    tickets: result.tickets.map(toTicketDTO),
                    pagination: {
                        total: result.total,
                        page: result.page,
                        limit: result.limit,
                        totalPages: result.totalPages,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/tickets/:id
    async getById(req, res, next) {
        try {
            const { id } = req.validated.params;

            const ticket = await ticketService.getTicketById(id);

            return res.status(200).json({
                success: true,
                message: "Ticket fetched successfully",
                data: {
                    ticket: toTicketDTO(ticket),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    // PATCH /api/tickets/:id
    async update(req, res, next) {
        try {
            const { id } = req.validated.params;

            const ticket = await ticketService.updateTicket(
                id,
                req.validated.body,
                req.user.id
            );

            return res.status(200).json({
                success: true,
                message: "Ticket updated successfully",
                data: {
                    ticket: toTicketDTO(ticket),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    // DELETE /api/tickets/:id
    async delete(req, res, next) {
        try {
            const { id } = req.validated.params;

            const result = await ticketService.deleteTicket(id);

            return res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new TicketController();
