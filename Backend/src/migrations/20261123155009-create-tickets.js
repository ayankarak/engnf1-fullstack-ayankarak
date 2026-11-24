"use strict";

export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("tickets", {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },

            external_id: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true,
            },

            subject: {
                type: Sequelize.STRING(150),
                allowNull: false,
            },

            body: {
                type: Sequelize.TEXT,
                allowNull: false,
            },

            auto_category: {
                type: Sequelize.ENUM(
                    "BILLING",
                    "BUG",
                    "FEATURE_REQUEST",
                    "LOGIN",
                    "DELIVERY"
                ),
                allowNull: false,
            },

            category: {
                type: Sequelize.ENUM(
                    "BILLING",
                    "BUG",
                    "FEATURE_REQUEST",
                    "LOGIN",
                    "DELIVERY"
                ),
                allowNull: false,
            },

            is_human_override: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            priority: {
                type: Sequelize.ENUM(
                    "LOW",
                    "MEDIUM",
                    "HIGH",
                    "URGENT"
                ),
                allowNull: false,
                defaultValue: "MEDIUM",
            },

            status: {
                type: Sequelize.ENUM(
                    "OPEN",
                    "IN_PROGRESS",
                    "RESOLVED",
                    "CLOSED"
                ),
                allowNull: false,
                defaultValue: "OPEN",
            },

            assignee_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "SET NULL",
            },

            is_reviewed: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },

            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        await queryInterface.addIndex("tickets", ["status"]);
        await queryInterface.addIndex("tickets", ["category"]);
        await queryInterface.addIndex("tickets", ["priority"]);
        await queryInterface.addIndex("tickets", ["assignee_id"]);
    },

    async down(queryInterface) {
        await queryInterface.dropTable("tickets");
    },
};
