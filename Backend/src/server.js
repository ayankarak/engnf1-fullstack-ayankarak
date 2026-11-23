
require("dotenv").config();

const app = require("./app");
const sequelize = require("./config/database");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Test MySQL connection
        await sequelize.authenticate();

        console.log("MySQL database connected successfully.");

        // Start Express server
        app.listen(PORT, () => {
            console.log(`TriageSync API running on port ${PORT}`);
            console.log(`URL: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Unable to start server:", error.message);
        process.exit(1);
    }
};

startServer();
