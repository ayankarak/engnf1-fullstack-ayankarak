import sequelizeModule from "sequelize";
import ApiError from "../utils/ApiError.js";
import constants from "../utils/constants.js";

const { DataTypes } = sequelizeModule;

const { AUDITED_FIELDS } = constants;

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
                type: DataTypes.ENUM(...AUDITED_FIELDS),
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
        }
    );

    // Audit events are append-only. This is the application-level guard; the database
    // also enforces it with triggers (see the audit-immutability migration).
    const rejectMutation = () => {
        throw new ApiError(405, "Audit events are immutable and cannot be modified or deleted");
    };

    TicketEvent.addHook("beforeUpdate", rejectMutation);
    TicketEvent.addHook("beforeDestroy", rejectMutation);
    TicketEvent.addHook("beforeBulkUpdate", rejectMutation);
    TicketEvent.addHook("beforeBulkDestroy", rejectMutation);
    TicketEvent.addHook("beforeUpsert", rejectMutation);

    return TicketEvent;
};

export default defineTicketEvent;
