const toTicketEventDTO = (event) => {
    if (!event) return null;

    const data = event.toJSON ? event.toJSON() : event;

    return {
        id: data.id,
        ticketId: data.ticketId,
        field: data.field,
        oldValue: data.oldValue,
        newValue: data.newValue,
        // Readable names for assignee changes (null for other fields).
        oldLabel: data.oldLabel ?? null,
        newLabel: data.newLabel ?? null,
        actor: data.actor,
        createdAt: data.createdAt,
    };
};

export default {
    toTicketEventDTO,
};
