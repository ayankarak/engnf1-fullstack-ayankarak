import sequelizeModule from "sequelize";
import constants from "../utils/constants.js";

const { DataTypes } = sequelizeModule;

const {
    TICKET_CATEGORIES,
    TICKET_PRIORITIES,
    TICKET_STATUSES,
} = constants;

const defineTicket = (sequelize) => {
    const Ticket = sequelize.define(
        "Ticket",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },

            externalId: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
                field: "external_id",
            },

            subject: {
                type: DataTypes.STRING(150),
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [1, 150],
                },
            },

            body: {
                type: DataTypes.TEXT,
                allowNull: false,
            },

            autoCategory: {
                type: DataTypes.ENUM(...TICKET_CATEGORIES),
                allowNull: false,
                field: "auto_category",
            },

            category: {
                type: DataTypes.ENUM(...TICKET_CATEGORIES),
                allowNull: false,
            },

            isHumanOverride: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                field: "is_human_override",
            },

            priority: {
                type: DataTypes.ENUM(...TICKET_PRIORITIES),
                allowNull: false,
                defaultValue: "MEDIUM",
            },

            status: {
                type: DataTypes.ENUM(...TICKET_STATUSES),
                allowNull: false,
                defaultValue: "OPEN",
            },

            assigneeId: {
                type: DataTypes.INTEGER,
                allowNull: true,
                field: "assignee_id",
            },

            isReviewed: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                field: "is_reviewed",
            },
        },
        {
            tableName: "tickets",
            timestamps: true,
            // Soft delete keeps the audit history (ticket_events) intact.
            paranoid: true,
        }
    );

    return Ticket;
};

export default defineTicket;
