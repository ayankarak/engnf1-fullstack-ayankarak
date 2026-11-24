const crypto = require("crypto");

const { Op } = require("sequelize");

const { sequelize, User } = require("../models");
const ticketRepository = require("../repositories/ticket.repository");
const ticketEventRepository = require("../repositories/ticket-event.repository");
const userRepository = require("../repositories/user.repository");
const ApiError = require("../utils/ApiError");
const { classifyTicket } = require("../utils/ticket-classifier");
const { escapeLike } = require("../utils/escape-like");
const {
    ROLES,
    AUDITED_FIELDS,
    SYSTEM_IMPORT_ACTOR,
} = require("../utils/constants");

const isUniqueConstraintError = (error) => error?.name === "SequelizeUniqueConstraintError";

const toEventValue = (value) => (value === null || value === undefined ? null : String(value));

const buildEvent = (ticketId, field, oldValue, newValue, actor) => ({
    ticketId,
    field,
    oldValue: toEventValue(oldValue),
    newValue: toEventValue(newValue),
    actor,
});

class TicketService {
    // Create a new ticket with automatic classification
    async createTicket(ticketData) {
        const classification = classifyTicket(ticketData);

        return await ticketRepository.create({
            externalId: ticketData.externalId || `MANUAL-${crypto.randomUUID()}`,
            subject: ticketData.subject,
            body: ticketData.body,
            ...classification,
            isHumanOverride: false,
        });
    }

    /**
     * Idempotent import keyed by externalId.
     *
     * The INSERT is attempted first and the UNIQUE(external_id) constraint decides who
     * wins, so concurrent imports of the same externalId can never create duplicates.
     * The loser(s) fall back to updating the existing row inside a transaction that
     * holds a row lock.
     *
     * Re-import rules:
     *  - subject, body and autoCategory are always refreshed;
     *  - category follows the classifier only while isHumanOverride is false;
     *  - priority is re-classified only when subject/body actually changed, so an
     *    unchanged re-import never reverts an agent's priority;
     *  - status, assignee and review state are never touched;
     *  - category/priority changes caused by the import are audited as system:import.
     *
     * Returns { ticket, created }.
     */
    async importTicket(ticketData) {
        const classification = classifyTicket(ticketData);

        try {
            const ticket = await ticketRepository.create({
                externalId: ticketData.externalId,
                subject: ticketData.subject,
                body: ticketData.body,
                ...classification,
                isHumanOverride: false,
            });

            return { ticket, created: true };
        } catch (error) {
            if (!isUniqueConstraintError(error)) throw error;
        }

        const ticket = await sequelize.transaction(async (transaction) => {
            const existing = await ticketRepository.findByExternalId(ticketData.externalId, {
                transaction,
                lock: true,
                paranoid: false,
            });

            if (!existing) {
                throw new ApiError(409, "Import conflict, please retry");
            }

            if (existing.deletedAt) {
                throw new ApiError(
                    409,
                    "A ticket with this externalId was deleted and cannot be re-imported"
                );
            }

            const contentChanged =
                existing.subject !== ticketData.subject || existing.body !== ticketData.body;

            const changes = {
                subject: ticketData.subject,
                body: ticketData.body,
                autoCategory: classification.autoCategory,
            };
            const events = [];

            if (!existing.isHumanOverride && existing.category !== classification.category) {
                events.push(
                    buildEvent(existing.id, "category", existing.category, classification.category, SYSTEM_IMPORT_ACTOR)
                );
                changes.category = classification.category;
            }

            if (contentChanged && existing.priority !== classification.priority) {
                events.push(
                    buildEvent(existing.id, "priority", existing.priority, classification.priority, SYSTEM_IMPORT_ACTOR)
                );
                changes.priority = classification.priority;
            }

            existing.set(changes);

            if (existing.changed()) {
                await existing.save({ transaction });
                await ticketEventRepository.createMany(events, { transaction });
            }

            return existing;
        });

        return { ticket, created: false };
    }

    // Ticket detail: ticket + assignee + chronological audit events.
    async getTicketById(id) {
        const ticket = await ticketRepository.findById(id);

        if (!ticket) {
            throw new ApiError(404, "Ticket not found");
        }

        const events = await this.loadEvents(id);

        return { ticket, events };
    }

    async getTicketEvents(id) {
        const ticket = await ticketRepository.findById(id);

        if (!ticket) {
            throw new ApiError(404, "Ticket not found");
        }

        return await this.loadEvents(id);
    }

    // Events oldest-first, with human-readable names for assignee changes.
    async loadEvents(ticketId) {
        const events = await ticketEventRepository.findByTicketId(ticketId);
        const plain = events.map((event) => event.toJSON());

        const userIds = new Set();
        for (const event of plain) {
            if (event.field !== "assigneeId") continue;
            for (const value of [event.oldValue, event.newValue]) {
                if (value !== null) userIds.add(Number(value));
            }
        }

        const names = new Map();
        if (userIds.size > 0) {
            const users = await User.findAll({
                attributes: ["id", "name"],
                where: { id: { [Op.in]: [...userIds] } },
            });
            users.forEach((user) => names.set(user.id, user.name));
        }

        const label = (event, value) => {
            if (event.field !== "assigneeId") return null;
            if (value === null) return "Unassigned";
            return names.get(Number(value)) || `User #${value}`;
        };

        return plain.map((event) => ({
            ...event,
            oldLabel: label(event, event.oldValue),
            newLabel: label(event, event.newValue),
        }));
    }

    async getAllTickets(query) {
        const { page, limit, q, status, category, priority, assigneeId, sortBy, sortOrder } = query;

        // Every supplied condition must match (AND).
        const where = {};

        if (status) where.status = status;
        if (category) where.category = category;
        if (priority) where.priority = priority;
        if (assigneeId) where.assigneeId = assigneeId;

        if (q) {
            const pattern = `%${escapeLike(q)}%`;

            where[Op.or] = [
                { subject: { [Op.like]: pattern } },
                { body: { [Op.like]: pattern } },
            ];
        }

        const result = await ticketRepository.findAll({
            where,
            limit,
            offset: (page - 1) * limit,
            order: [
                [sortBy, sortOrder.toUpperCase()],
                ["id", "DESC"],
            ],
        });

        return {
            tickets: result.rows,
            total: result.count,
            page,
            limit,
            totalPages: Math.ceil(result.count / limit),
        };
    }

    async getStats() {
        const [byStatus, urgent] = await Promise.all([
            ticketRepository.countByStatus(),
            ticketRepository.countByPriority("URGENT"),
        ]);

        const count = (status) => byStatus[status] || 0;

        return {
            total: Object.values(byStatus).reduce((sum, n) => sum + n, 0),
            open: count("OPEN"),
            inProgress: count("IN_PROGRESS"),
            resolved: count("RESOLVED"),
            closed: count("CLOSED"),
            urgent,
        };
    }

    /**
     * Agent update. The ticket change and its audit events are written in ONE
     * transaction: either both are stored or neither is. Only real changes produce events.
     */
    async updateTicket(id, patch, actor) {
        await sequelize.transaction(async (transaction) => {
            const ticket = await ticketRepository.findById(id, { transaction, lock: true });

            if (!ticket) {
                throw new ApiError(404, "Ticket not found");
            }

            if (patch.assigneeId !== undefined && patch.assigneeId !== null) {
                const assignee = await userRepository.findById(patch.assigneeId, { transaction });

                if (!assignee || ![ROLES.AGENT, ROLES.ADMIN].includes(assignee.role)) {
                    throw new ApiError(400, "Assignee must be an existing agent or admin");
                }
            }

            const changes = {};
            const events = [];

            for (const field of AUDITED_FIELDS) {
                if (patch[field] === undefined || patch[field] === ticket[field]) continue;

                changes[field] = patch[field];
                events.push(buildEvent(ticket.id, field, ticket[field], patch[field], actor.email));
            }

            // Marking as reviewed is a workflow flag, not an audited field.
            if (patch.isReviewed !== undefined && patch.isReviewed !== ticket.isReviewed) {
                changes.isReviewed = patch.isReviewed;
            }

            if (Object.keys(changes).length === 0) return;

            // A real manual category change hands control of the category to the agent.
            if (changes.category !== undefined) {
                changes.isHumanOverride = true;
            }

            await ticketRepository.save(ticket, changes, { transaction });
            await ticketEventRepository.createMany(events, { transaction });
        });

        return await this.getTicketById(id);
    }

    // Soft delete: the ticket disappears from the app, its audit history is kept.
    async deleteTicket(id) {
        const ticket = await ticketRepository.findById(id);

        if (!ticket) {
            throw new ApiError(404, "Ticket not found");
        }

        await ticketRepository.softDelete(ticket);

        return { message: "Ticket deleted successfully" };
    }
}

module.exports = new TicketService();
