import env from "./config/env.js";
import app from "./app.js";
import sequelize from "./config/database.js";

const startServer = async () => {
    try {
        // Test MySQL connection
        await sequelize.authenticate();

        console.log("MySQL database connected successfully.");

        // Start Express server
        const server = app.listen(env.PORT, () => {
            console.log(`TriageSync API running on port ${env.PORT}`);
            console.log(`URL: http://localhost:${env.PORT}`);
        });

        const shutdown = (signal) => {
            console.log(`${signal} received, shutting down...`);

            server.close(async () => {
                await sequelize.close();
                process.exit(0);
            });
        };

        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));
    } catch (error) {
        console.error("Unable to start server:", error.message);
        process.exit(1);
    }
};

startServer();
