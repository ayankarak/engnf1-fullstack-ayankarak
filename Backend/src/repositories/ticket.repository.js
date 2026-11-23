
const { Ticket, User, TicketEvent } = require("../models");

class TicketRepository {
    async create(ticketData) {
        return await Ticket.create(ticketData);
    }

    async findById(id) {
        return await Ticket.findByPk(id, {
            include: [
                {
                    model: User,
                    as: "assignee",
                    attributes: ["id", "name", "email"],
                },
                {
                    model: TicketEvent,
                    as: "events",
                },
            ],
        });
    }

    async findByExternalId(externalId) {
        return await Ticket.findOne({
            where: { externalId },
        });
    }

    async findAll(options = {}) {
        const { where = {}, limit = 10, offset = 0 } = options;

        return await Ticket.findAndCountAll({
            where,
            limit,
            offset,
            order: [["createdAt", "DESC"]],
            distinct: true,
        });
    }

    async update(id, updateData) {
        const [updatedRows] = await Ticket.update(updateData, {
            where: { id },
        });

        if (updatedRows === 0) return null;

        return await Ticket.findByPk(id);
    }

    async delete(id) {
        return await Ticket.destroy({
            where: { id },
        });
    }
}

module.exports = new TicketRepository();
