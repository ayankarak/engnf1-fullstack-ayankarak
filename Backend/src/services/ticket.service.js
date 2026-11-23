
const ticketRepository = require("../repositories/ticket.repository");
const { classifyTicket } = require("../utils/ticket-classifier");

class TicketService {
    // Create a new ticket with automatic classification
    async createTicket(ticketData) {
        const classification = classifyTicket(ticketData);

        return await ticketRepository.create({
            ...ticketData,
            ...classification,
            isHumanOverride: false,
        });
    }

    // Import ticket without creating duplicates
    async importTicket(ticketData) {
        if (!ticketData.externalId) {
            const error = new Error("External ID is required for ticket import");
            error.statusCode = 400;
            throw error;
        }

        const classification = classifyTicket(ticketData);

        // Check whether the ticket already exists
        const existingTicket = await ticketRepository.findByExternalId(
            ticketData.externalId
        );

        // If ticket exists, update it instead of creating a duplicate
        if (existingTicket) {
            const updateData = {
                subject: ticketData.subject,
                body: ticketData.body,
                autoCategory: classification.autoCategory,
                priority: classification.priority,
            };

            // Preserve manually assigned category
            if (!existingTicket.isHumanOverride) {
                updateData.category = classification.category;
            }

            return await ticketRepository.update(
                existingTicket.id,
                updateData
            );
        }

        // Create a new ticket
        return await ticketRepository.create({
            ...ticketData,
            ...classification,
            isHumanOverride: false,
        });
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

        // A manually changed category becomes a human override
        if (updateData.category !== undefined) {
            updateData.isHumanOverride = true;
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

        return {
            message: "Ticket deleted successfully",
        };
    }
}

module.exports = new TicketService();
