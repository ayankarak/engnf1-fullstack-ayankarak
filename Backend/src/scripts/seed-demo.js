import dotenv from "dotenv";
import sequelize from "../config/database.js";
import ticketService from "../services/ticket.service.js";

dotenv.config();

// Sample complaints, imported through the real import service (so they are classified
// automatically). Safe to run repeatedly: imports are idempotent per externalId.
// Run with: npm run db:seed-demo
const SAMPLES = [
    ["DEMO-001", "Payment failed", "Money deducted but order not confirmed"],
    ["DEMO-002", "Refund still missing", "I returned the item two weeks ago and the refund has not arrived."],
    ["DEMO-003", "Invoice shows wrong amount", "The invoice for March lists a charge I do not recognise."],
    ["DEMO-004", "Locked out of my account", "I am locked out after too many password attempts. Urgent, I need access today."],
    ["DEMO-005", "2FA codes never arrive", "The 2FA text message does not come, so I cannot log in."],
    ["DEMO-006", "Package not arrived", "My package has not arrived and tracking has not updated for a week."],
    ["DEMO-007", "Wrong shipping address", "The delivery went to my old address."],
    ["DEMO-008", "App crash on startup", "The mobile app crashes right after the splash screen."],
    ["DEMO-009", "Checkout error 500", "Pressing Pay shows an error 500 page."],
    ["DEMO-010", "Export throws exception", "An exception is thrown when exporting a report as CSV."],
    ["DEMO-011", "Production down", "Our integration is returning errors and production down since 09:00. Urgent!"],
    ["DEMO-012", "Please add dark mode", "It would be great to have a dark theme."],
    ["DEMO-013", "Bulk edit for tickets", "Could you let us select several tickets and edit them at once?"],
];

const run = async () => {
    try {
        await sequelize.authenticate();

        let created = 0;
        for (const [externalId, subject, body] of SAMPLES) {
            const result = await ticketService.importTicket({ externalId, subject, body });
            if (result.created) created += 1;
        }

        console.log(`Demo tickets: ${created} created, ${SAMPLES.length - created} already existed.`);
    } catch (error) {
        console.error("Seeding failed:", error.message);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
};

run();
