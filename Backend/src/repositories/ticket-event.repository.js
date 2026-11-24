const { TicketEvent } = require("../models");

// Append-only repository: there is intentionally no update or delete method.
class TicketEventRepository {
    async createMany(events, options = {}) {
        if (events.length === 0) return [];

        return await TicketEvent.bulkCreate(events, {
            transaction: options.transaction,
        });
    }

    async findByTicketId(ticketId) {
        return await TicketEvent.findAll({
            where: { ticketId },
            // Chronological; id breaks ties between events written in the same second.
            order: [
                ["createdAt", "ASC"],
                ["id", "ASC"],
            ],
        });
    }
}

module.exports = new TicketEventRepository();
