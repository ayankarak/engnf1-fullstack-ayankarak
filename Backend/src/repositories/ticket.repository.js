import sequelizeModule from "sequelize";
import models from "../models/index.js";

const { fn, col } = sequelizeModule;

const { Ticket, User } = models;

const ASSIGNEE_INCLUDE = {
    model: User,
    as: "assignee",
    attributes: ["id", "name", "email"],
};

// Row lock only makes sense inside a transaction.
const lockOption = (options) =>
    options.lock && options.transaction ? { lock: options.transaction.LOCK.UPDATE } : {};

class TicketRepository {
    async create(ticketData, options = {}) {
        return await Ticket.create(ticketData, { transaction: options.transaction });
    }

    async findById(id, options = {}) {
        return await Ticket.findByPk(id, {
            include: options.lock ? [] : [ASSIGNEE_INCLUDE],
            transaction: options.transaction,
            ...lockOption(options),
        });
    }

    async findByExternalId(externalId, options = {}) {
        return await Ticket.findOne({
            where: { externalId },
            paranoid: options.paranoid !== false,
            transaction: options.transaction,
            ...lockOption(options),
        });
    }

    async findAll({ where = {}, limit = 10, offset = 0, order } = {}) {
        return await Ticket.findAndCountAll({
            where,
            include: [ASSIGNEE_INCLUDE],
            limit,
            offset,
            order: order || [["createdAt", "DESC"], ["id", "DESC"]],
            distinct: true,
        });
    }

    async save(ticket, changes, options = {}) {
        return await ticket.update(changes, { transaction: options.transaction });
    }

    async softDelete(ticket) {
        return await ticket.destroy();
    }

    async countByStatus() {
        const rows = await Ticket.findAll({
            attributes: ["status", [fn("COUNT", col("id")), "count"]],
            group: ["status"],
            raw: true,
        });

        return Object.fromEntries(rows.map((row) => [row.status, Number(row.count)]));
    }

    async countByPriority(priority) {
        return await Ticket.count({ where: { priority } });
    }
}

export default new TicketRepository();
