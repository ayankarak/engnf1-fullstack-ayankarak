
const { DataTypes } = require("sequelize");

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
                    len: [3, 150],
                },
            },

            body: {
                type: DataTypes.TEXT,
                allowNull: false,
            },

            autoCategory: {
                type: DataTypes.ENUM(
                    "BILLING",
                    "BUG",
                    "FEATURE_REQUEST",
                    "LOGIN",
                    "DELIVERY"
                ),
                allowNull: false,
                field: "auto_category",
            },

            category: {
                type: DataTypes.ENUM(
                    "BILLING",
                    "BUG",
                    "FEATURE_REQUEST",
                    "LOGIN",
                    "DELIVERY"
                ),
                allowNull: false,
            },

            isHumanOverride: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                field: "is_human_override",
            },

            priority: {
                type: DataTypes.ENUM(
                    "LOW",
                    "MEDIUM",
                    "HIGH",
                    "URGENT"
                ),
                allowNull: false,
                defaultValue: "MEDIUM",
            },

            status: {
                type: DataTypes.ENUM(
                    "OPEN",
                    "IN_PROGRESS",
                    "RESOLVED",
                    "CLOSED"
                ),
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
        }
    );

    return Ticket;
};

module.exports = defineTicket;
