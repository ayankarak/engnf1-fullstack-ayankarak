const { toUserDTO } = require("./user.dto");
const { toTicketEventDTO } = require("./ticket-event.dto");

const toTicketDTO = (ticket) => {
    if (!ticket) return null;

    const data = ticket.toJSON ? ticket.toJSON() : ticket;

    return {
        id: data.id,
        externalId: data.externalId,
        subject: data.subject,
        body: data.body,
        autoCategory: data.autoCategory,
        category: data.category,
        isHumanOverride: data.isHumanOverride,
        priority: data.priority,
        status: data.status,
        assigneeId: data.assigneeId,
        isReviewed: data.isReviewed,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,

        assignee: data.assignee
            ? toUserDTO(data.assignee)
            : null,

        events: Array.isArray(data.events)
            ? data.events.map(toTicketEventDTO)
            : [],
    };
};

module.exports = {
    toTicketDTO,
};
