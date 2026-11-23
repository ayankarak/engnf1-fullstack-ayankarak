
const sequelize = require("../config/database");

const defineUser = require("./user.model");
const defineTicket = require("./ticket.model");
const defineTicketEvent = require("./ticket-event.model");

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

module.exports = {
    sequelize,
    User,
    Ticket,
    TicketEvent,
};
