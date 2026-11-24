"use strict";

const TRIGGERS = {
    update: "ticket_events_block_update",
    delete: "ticket_events_block_delete",
};

export default {
    async up(queryInterface) {
        await queryInterface.addIndex("tickets", ["createdAt"], {
            name: "tickets_created_at",
        });

        // Timeline queries: events of one ticket in chronological order.
        await queryInterface.addIndex("ticket_events", ["ticket_id", "createdAt"], {
            name: "ticket_events_ticket_id_created_at",
        });

        // Database-level protection of the audit trail: rows can be inserted, never changed.
        // Needs the TRIGGER privilege (and, if binary logging is on,
        // log_bin_trust_function_creators=1 or SUPER).
        try {
            await queryInterface.sequelize.query(
                `CREATE TRIGGER ${TRIGGERS.update} BEFORE UPDATE ON ticket_events
                 FOR EACH ROW SIGNAL SQLSTATE '45000'
                 SET MESSAGE_TEXT = 'ticket_events rows are immutable'`
            );

            await queryInterface.sequelize.query(
                `CREATE TRIGGER ${TRIGGERS.delete} BEFORE DELETE ON ticket_events
                 FOR EACH ROW SIGNAL SQLSTATE '45000'
                 SET MESSAGE_TEXT = 'ticket_events rows are immutable'`
            );
        } catch (error) {
            error.message =
                `Could not create audit-immutability triggers (${error.message}). ` +
                "The MySQL user needs the TRIGGER privilege, and with binary logging enabled " +
                "log_bin_trust_function_creators must be 1.";
            throw error;
        }
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS ${TRIGGERS.update}`);
        await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS ${TRIGGERS.delete}`);

        await queryInterface.removeIndex("ticket_events", "ticket_events_ticket_id_created_at");
        await queryInterface.removeIndex("tickets", "tickets_created_at");
    },
};
