const { TicketEvent } = require("../models");

class TicketEventRepository {
    async create(eventData, options = {}) {
        return TicketEvent.create(eventData, options);
    }

    async findById(id) {
        return TicketEvent.findByPk(id);
    }

    async findByTicketId(ticketId) {
        return TicketEvent.findAll({
            where: { ticketId },
            order: [["createdAt", "DESC"]],
        });
    }
}

module.exports = new TicketEventRepository();
