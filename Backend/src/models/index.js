import sequelize from "../config/database.js";
import defineUser from "./user.model.js";
import defineTicket from "./ticket.model.js";
import defineTicketEvent from "./ticket-event.model.js";

// Initialize models
const User = defineUser(sequelize);
const Ticket = defineTicket(sequelize);
const TicketEvent = defineTicketEvent(sequelize);

// User - Ticket relationship
User.hasMany(Ticket, {
    foreignKey: "assigneeId",
    as: "assignedTickets",
});

Ticket.belongsTo(User, {
    foreignKey: "assigneeId",
    as: "assignee",
});

// Ticket - TicketEvent relationship
Ticket.hasMany(TicketEvent, {
    foreignKey: "ticketId",
    as: "events",
});

TicketEvent.belongsTo(Ticket, {
    foreignKey: "ticketId",
    as: "ticket",
});

export default {
    sequelize,
    User,
    Ticket,
    TicketEvent,
};
