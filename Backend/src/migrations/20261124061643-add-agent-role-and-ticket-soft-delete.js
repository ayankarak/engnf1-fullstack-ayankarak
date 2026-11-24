"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        // Additive: existing rows keep their current role value.
        await queryInterface.changeColumn("users", "role", {
            type: Sequelize.ENUM("USER", "AGENT", "ADMIN"),
            allowNull: false,
            defaultValue: "USER",
        });

        // Soft delete: deleting a ticket must not destroy its audit history.
        await queryInterface.addColumn("tickets", "deletedAt", {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: null,
        });

        await queryInterface.addIndex("tickets", ["deletedAt"], {
            name: "tickets_deleted_at",
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex("tickets", "tickets_deleted_at");
        await queryInterface.removeColumn("tickets", "deletedAt");

        await queryInterface.sequelize.query(
            "UPDATE users SET role = 'USER' WHERE role = 'AGENT'"
        );

        await queryInterface.changeColumn("users", "role", {
            type: Sequelize.ENUM("USER", "ADMIN"),
            allowNull: false,
            defaultValue: "USER",
        });
    },
};
