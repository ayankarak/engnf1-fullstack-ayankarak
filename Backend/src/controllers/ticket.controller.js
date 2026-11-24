import ticketService from "../services/ticket.service.js";
import ticketDto from "../dto/ticket.dto.js";
import ticketEventDto from "../dto/ticket-event.dto.js";

const { toTicketDTO } = ticketDto;
const { toTicketEventDTO } = ticketEventDto;

class TicketController {
    // POST /api/tickets
    async create(req, res, next) {
        try {
            const ticket = await ticketService.createTicket(req.validated.body);

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

    // POST /api/tickets/import  (201 = created, 200 = existing ticket re-imported)
    async importTicket(req, res, next) {
        try {
            const { ticket, created } = await ticketService.importTicket(req.validated.body);

            return res.status(created ? 201 : 200).json({
                success: true,
                message: created
                    ? "Ticket imported successfully"
                    : "Ticket already existed and was updated",
                data: {
                    created,
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
            const result = await ticketService.getAllTickets(req.validated.query);

            return res.status(200).json({
                success: true,
                message: "Tickets fetched successfully",
                data: {
                    tickets: result.tickets.map((ticket) => toTicketDTO(ticket)),
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

    // GET /api/tickets/stats
    async getStats(req, res, next) {
        try {
            const stats = await ticketService.getStats();

            return res.status(200).json({
                success: true,
                message: "Ticket statistics fetched successfully",
                data: { stats },
            });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/tickets/:id
    async getById(req, res, next) {
        try {
            const { id } = req.validated.params;

            const { ticket, events } = await ticketService.getTicketById(id);

            return res.status(200).json({
                success: true,
                message: "Ticket fetched successfully",
                data: {
                    ticket: toTicketDTO(ticket, events),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/tickets/:id/events
    async getEvents(req, res, next) {
        try {
            const { id } = req.validated.params;

            const events = await ticketService.getTicketEvents(id);

            return res.status(200).json({
                success: true,
                message: "Ticket events fetched successfully",
                data: {
                    events: events.map(toTicketEventDTO),
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

            const { ticket, events } = await ticketService.updateTicket(
                id,
                req.validated.body,
                req.user
            );

            return res.status(200).json({
                success: true,
                message: "Ticket updated successfully",
                data: {
                    ticket: toTicketDTO(ticket, events),
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

export default new TicketController();
