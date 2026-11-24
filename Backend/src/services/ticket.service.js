const { randomUUID } = require("crypto");
const { Op } = require("sequelize");
const { sequelize, Ticket } = require("../models");
const ticketRepository = require("../repositories/ticket.repository");
const ticketEventRepository = require("../repositories/ticket-event.repository");
const { classifyTicket } = require("../utils/ticket-classifier");

const AUDITED_FIELDS = ["category", "priority", "status", "assigneeId"];

const httpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// Escape SQL LIKE metacharacters. Sequelize still binds the resulting value.
const escapeLike = (value) => value.replace(/[\\%_]/g, "\\$&");

class TicketService {
    async createTicket(ticketData) {
        const classification = classifyTicket(ticketData);
        const ticket = await ticketRepository.create({
            ...ticketData,
            externalId: ticketData.externalId || randomUUID(),
            ...classification,
            isHumanOverride: false,
        });
        return ticketRepository.findById(ticket.id);
    }

    async importTicket(ticketData) {
        if (!ticketData.externalId) {
            throw httpError("External ID is required for ticket import", 400);
        }

        const classification = classifyTicket(ticketData);

        // The unique external_id constraint plus findOrCreate protects against
        // two import requests creating the same ticket concurrently.
        return sequelize.transaction(async (transaction) => {
            const [ticket, created] = await Ticket.findOrCreate({
                where: { externalId: ticketData.externalId },
                defaults: {
                    ...ticketData,
                    ...classification,
                    isHumanOverride: false,
                },
                transaction,
            });

            if (!created) {
                const updateData = {
                    subject: ticketData.subject,
                    body: ticketData.body,
                    autoCategory: classification.autoCategory,
                    priority: classification.priority,
                };

                // A human-selected category remains authoritative on re-import.
                if (!ticket.isHumanOverride) {
                    updateData.category = classification.category;
                }

                await ticket.update(updateData, { transaction });
            }

            return ticketRepository.findById(ticket.id, { transaction });
        });
    }

    async getTicketById(id) {
        const ticket = await ticketRepository.findById(id);
        if (!ticket) throw httpError("Ticket not found", 404);
        return ticket;
    }

    async getAllTickets(query) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const offset = (page - 1) * limit;
        const conditions = [];

        if (query.status) conditions.push({ status: query.status });
        if (query.category) conditions.push({ category: query.category });
        if (query.priority) conditions.push({ priority: query.priority });

        if (query.search && query.search.trim()) {
            const pattern = `%${escapeLike(query.search.trim())}%`;
            conditions.push({
                [Op.or]: [
                    { subject: { [Op.like]: pattern } },
                    { body: { [Op.like]: pattern } },
                ],
            });
        }

        const where = conditions.length ? { [Op.and]: conditions } : {};
        const result = await ticketRepository.findAll({ where, limit, offset });

        return {
            tickets: result.rows,
            total: result.count,
            page,
            limit,
            totalPages: Math.ceil(result.count / limit),
        };
    }

    async updateTicket(id, updateData, actorId) {
        return sequelize.transaction(async (transaction) => {
            const ticket = await Ticket.findByPk(id, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!ticket) throw httpError("Ticket not found", 404);

            const changes = [];
            for (const field of AUDITED_FIELDS) {
                if (updateData[field] !== undefined) {
                    const oldValue = ticket[field] == null ? null : String(ticket[field]);
                    const newValue = updateData[field] == null ? null : String(updateData[field]);
                    if (oldValue !== newValue) {
                        changes.push({
                            ticketId: ticket.id,
                            field,
                            oldValue,
                            newValue,
                            actor: String(actorId),
                        });
                    }
                }
            }

            const safeUpdate = { ...updateData };
            if (Object.prototype.hasOwnProperty.call(updateData, "category")) {
                safeUpdate.isHumanOverride = true;
            }

            await ticket.update(safeUpdate, { transaction });

            // Ticket changes and their audit events commit or roll back together.
            for (const event of changes) {
                await ticketEventRepository.create(event, { transaction });
            }

            return ticketRepository.findById(id, { transaction });
        });
    }

    async deleteTicket(id) {
        const ticket = await ticketRepository.findById(id);
        if (!ticket) throw httpError("Ticket not found", 404);

        if (ticket.events && ticket.events.length > 0) {
            throw httpError(
                "This ticket has audit history and cannot be deleted",
                409
            );
        }

        await ticketRepository.delete(id);
        return { message: "Ticket deleted successfully" };
    }
}

module.exports = new TicketService();
