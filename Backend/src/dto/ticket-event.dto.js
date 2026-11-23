
const toTicketEventDTO = (event) => {
    if (!event) return null;

    const data = event.toJSON ? event.toJSON() : event;

    return {
        id: data.id,
        ticketId: data.ticketId,
        field: data.field,
        oldValue: data.oldValue,
        newValue: data.newValue,
        actor: data.actor,
        createdAt: data.createdAt,
    };
};

module.exports = {
    toTicketEventDTO,
};
