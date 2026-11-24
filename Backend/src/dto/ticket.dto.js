import userDto from "./user.dto.js";
import ticketEventDto from "./ticket-event.dto.js";

const { toUserDTO } = userDto;
const { toTicketEventDTO } = ticketEventDto;

// `events` is only included for detail responses (pass the loaded events as 2nd arg).
const toTicketDTO = (ticket, events) => {
    if (!ticket) return null;

    const data = ticket.toJSON ? ticket.toJSON() : ticket;

    const dto = {
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

        assignee: data.assignee ? toUserDTO(data.assignee) : null,
    };

    if (Array.isArray(events)) {
        dto.events = events.map(toTicketEventDTO);
    }

    return dto;
};

export default {
    toTicketDTO,
};
