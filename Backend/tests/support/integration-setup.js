import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.NODE_ENV = "test";

const backendRoot = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(backendRoot, ".env") });

const testDatabase = process.env.TEST_DB_NAME || "triagesync_test";

if (!/_test$/.test(testDatabase)) {
    throw new Error(
        `Refusing to run: TEST_DB_NAME ("${testDatabase}") must end with "_test" because the integration tests delete all rows.`
    );
}

process.env.DB_NAME = testDatabase;

const models = (await import("../../src/models/index.js")).default;
const state = { server: null, baseUrl: null, counter: 0 };

const prepareSchema = async () => {
    // SKIP_MIGRATIONS=1 -> the schema was prepared by other means.
    if (process.env.SKIP_MIGRATIONS === "1") return;

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${testDatabase}\``);
    await connection.end();

    execFileSync(
        process.execPath,
        [path.join(backendRoot, "node_modules", "sequelize-cli", "lib", "sequelize"), "db:migrate", "--env", "test"],
        { cwd: backendRoot, stdio: "inherit", env: process.env }
    );
};

const setup = async () => {
    await prepareSchema();

    const { default: app } = await import("../../src/app.js");

    await new Promise((resolve) => {
        state.server = app.listen(0, "127.0.0.1", resolve);
    });

    state.baseUrl = `http://127.0.0.1:${state.server.address().port}`;
};

const teardown = async () => {
    await new Promise((resolve) => state.server.close(resolve));
    await models.sequelize.close();
};

const resetDb = async () => {
    const { sequelize, Ticket, User } = models;

    // TRUNCATE is DDL, so the MySQL immutability triggers (BEFORE DELETE) do not fire.
    if (sequelize.getDialect() === "mysql") {
        await sequelize.query("TRUNCATE TABLE ticket_events");
    } else {
        await sequelize.query("DELETE FROM ticket_events");
    }

    await Ticket.destroy({ where: {}, force: true });
    await User.destroy({ where: {} });
};

// Creates a user directly in the database and returns it with a valid token.
const makeUser = async (role = "USER", name = role) => {
    const { signToken } = (await import("../../src/utils/jwt.js")).default;

    state.counter += 1;

    const user = await models.User.create({
        name: `${name} ${state.counter}`,
        email: `${role.toLowerCase()}${state.counter}@example.com`,
        passwordHash: bcrypt.hashSync("password123", 4),
        role,
    });

    return { user, token: signToken(user), email: user.email };
};

const api = async (method, urlPath, { token, body } = {}) => {
    const response = await fetch(`${state.baseUrl}${urlPath}`, {
        method,
        headers: {
            ...(body !== undefined && { "Content-Type": "application/json" }),
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    let json = null;
    try {
        json = await response.json();
    } catch {
        // non-JSON response
    }

    return { status: response.status, body: json };
};

const importTicket = (token, externalId, subject, body) =>
    api("POST", "/api/tickets/import", { token, body: { externalId, subject, body } });

const isMysql = () => models.sequelize.getDialect() === "mysql";

export default { setup, teardown, resetDb, makeUser, api, importTicket, isMysql, models };
