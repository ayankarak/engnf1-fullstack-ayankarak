require("dotenv").config();

const sequelize = require("../config/database");

const testDatabaseConnection = async () => {
    try {
        await sequelize.authenticate();

        console.log("Database connection established successfully.");
    } catch (error) {
        console.error("Unable to connect to database:", error.message);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
};

testDatabaseConnection();
