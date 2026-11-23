
const ticketRepository = require("../repositories/ticket.repository");

class TicketService {
    async createTicket(ticketData) {
        return await ticketRepository.create(ticketData);
    }

    async getTicketById(id) {
        const ticket = await ticketRepository.findById(id);

        if (!ticket) {
            const error = new Error("Ticket not found");
            error.statusCode = 404;
            throw error;
        }

        return ticket;
    }

    async getAllTickets(query) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const offset = (page - 1) * limit;

        const where = {};

        if (query.status) where.status = query.status;
        if (query.category) where.category = query.category;
        if (query.priority) where.priority = query.priority;

        const result = await ticketRepository.findAll({
            where,
            limit,
            offset,
        });

        return {
            tickets: result.rows,
            total: result.count,
            page,
            limit,
            totalPages: Math.ceil(result.count / limit),
        };
    }

    async updateTicket(id, updateData) {
        const existingTicket = await ticketRepository.findById(id);

        if (!existingTicket) {
            const error = new Error("Ticket not found");
            error.statusCode = 404;
            throw error;
        }

        return await ticketRepository.update(id, updateData);
    }

    async deleteTicket(id) {
        const existingTicket = await ticketRepository.findById(id);

        if (!existingTicket) {
            const error = new Error("Ticket not found");
            error.statusCode = 404;
            throw error;
        }

        await ticketRepository.delete(id);

        return { message: "Ticket deleted successfully" };
    }
}

module.exports = new TicketService();
