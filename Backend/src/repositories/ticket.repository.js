const { Ticket, User, TicketEvent } = require("../models");

const ticketIncludes = [
    { model: User, as: "assignee", attributes: ["id", "name", "email"] },
    { model: TicketEvent, as: "events" },
];

class TicketRepository {
    async create(ticketData, options = {}) {
        return Ticket.create(ticketData, options);
    }

    async findById(id, options = {}) {
        return Ticket.findByPk(id, {
            ...options,
            include: ticketIncludes,
        });
    }

    async findByExternalId(externalId, options = {}) {
        return Ticket.findOne({ where: { externalId }, ...options });
    }

    async findAll(options = {}) {
        const { where = {}, limit = 10, offset = 0 } = options;
        return Ticket.findAndCountAll({
            where,
            limit,
            offset,
            order: [["createdAt", "DESC"]],
            distinct: true,
        });
    }

    async update(id, updateData, options = {}) {
        const ticket = await Ticket.findByPk(id, options);
        if (!ticket) return null;
        await ticket.update(updateData, options);
        return this.findById(id, options);
    }

    async delete(id, options = {}) {
        return Ticket.destroy({ where: { id }, ...options });
    }
}

module.exports = new TicketRepository();
