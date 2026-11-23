
const { TicketEvent } = require("../models");

class TicketEventRepository {
    async create(eventData) {
        return await TicketEvent.create(eventData);
    }

    async findById(id) {
        return await TicketEvent.findByPk(id);
    }

    async findByTicketId(ticketId) {
        return await TicketEvent.findAll({
            where: { ticketId },
            order: [["createdAt", "DESC"]],
        });
    }

    async deleteByTicketId(ticketId) {
        return await TicketEvent.destroy({
            where: { ticketId },
        });
    }
}

module.exports = new TicketEventRepository();
