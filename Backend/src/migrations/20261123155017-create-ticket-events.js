export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("ticket_events", {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },

            ticket_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "tickets",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "RESTRICT",
            },

            field: {
                type: Sequelize.ENUM(
                    "category",
                    "priority",
                    "status",
                    "assigneeId"
                ),
                allowNull: false,
            },

            old_value: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },

            new_value: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },

            actor: {
                type: Sequelize.STRING(254),
                allowNull: false,
            },

            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        await queryInterface.addIndex(
            "ticket_events",
            ["ticket_id"]
        );
    },

    async down(queryInterface) {
        await queryInterface.dropTable("ticket_events");
    },
};
