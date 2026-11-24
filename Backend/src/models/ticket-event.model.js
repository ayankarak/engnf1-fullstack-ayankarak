
const { DataTypes } = require("sequelize");

const defineTicketEvent = (sequelize) => {
    const TicketEvent = sequelize.define(
        "TicketEvent",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },

            ticketId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                field: "ticket_id",
            },

            field: {
                type: DataTypes.ENUM(
                    "category",
                    "priority",
                    "status",
                    "assigneeId"
                ),
                allowNull: false,
            },

            oldValue: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: "old_value",
            },

            newValue: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: "new_value",
            },

            actor: {
                type: DataTypes.STRING(254),
                allowNull: false,
            },
        },
        {
            tableName: "ticket_events",
            timestamps: true,
            updatedAt: false,
            hooks: {
                beforeUpdate() {
                    throw new Error("Ticket audit events are immutable");
                },
                beforeDestroy() {
                    throw new Error("Ticket audit events are immutable");
                },
                beforeBulkUpdate() {
                    throw new Error("Ticket audit events are immutable");
                },
                beforeBulkDestroy() {
                    throw new Error("Ticket audit events are immutable");
                },
            },
        }
    );

    return TicketEvent;
};

module.exports = defineTicketEvent;
