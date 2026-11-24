import dotenv from "dotenv";

// Used by sequelize-cli (migrations). Intentionally does not require JWT settings,
// so `npm run db:migrate` only needs the database variables.
dotenv.config();

const base = {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    dialect: "mysql",
    logging: false,
};

export default {
    development: { ...base, database: process.env.DB_NAME },

    // Integration tests run against a separate database (never your development data).
    test: { ...base, database: process.env.TEST_DB_NAME || "triagesync_test" },

    production: { ...base, database: process.env.DB_NAME },
};
