import "../support/set-env.js";
import models from "../../src/models/index.js";
import ticketDto from "../../src/dto/ticket.dto.js";
import userDto from "../../src/dto/user.dto.js";
import userRepository from "../../src/repositories/user.repository.js";
import errorHandler from "../../src/middlewares/error.middleware.js";
import authorize from "../../src/middlewares/role.middleware.js";
import authenticate from "../../src/middlewares/auth.middleware.js";
import jwtModule from "../../src/utils/jwt.js";
import env from "../../src/config/env.js";
import jwt from "jsonwebtoken";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const { signToken } = jwtModule;
const { toUserDTO } = userDto;
const { toTicketDTO } = ticketDto;
const { TicketEvent } = models;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const run = async (middleware, req) => {
    let captured;
    await middleware(req, {}, (err) => {
        captured = err;
    });
    return captured;
};

const withUser = (user, fn) => async () => {
    const original = userRepository.findById;
    userRepository.findById = async () => user;
    try {
        await fn();
    } finally {
        userRepository.findById = original;
    }
};

const agent = { id: 7, name: "Ann", email: "ann@example.com", role: "AGENT" };

test("authenticate: missing token -> 401", async () => {
    const err = await run(authenticate, { headers: {} });
    assert.equal(err.statusCode, 401);
    assert.match(err.message, /required/i);
});

test("authenticate: malformed header -> 401", async () => {
    const err = await run(authenticate, { headers: { authorization: "Token abc" } });
    assert.equal(err.statusCode, 401);
});

test("authenticate: garbage token -> 401", async () => {
    const err = await run(authenticate, { headers: { authorization: "Bearer not.a.jwt" } });
    assert.equal(err.statusCode, 401);
    assert.match(err.message, /invalid/i);
});

test("authenticate: token signed with another secret is rejected", async () => {
    const forged = jwt.sign({ id: 7, role: "ADMIN" }, "x".repeat(40));
    const err = await run(authenticate, { headers: { authorization: `Bearer ${forged}` } });
    assert.equal(err.statusCode, 401);
});

test("authenticate: unsigned (alg none) token is rejected", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ id: 7, role: "ADMIN" })).toString("base64url");
    const err = await run(authenticate, { headers: { authorization: `Bearer ${header}.${payload}.` } });
    assert.equal(err.statusCode, 401);
});

test("authenticate: expired token -> 401 'expired'", async () => {
    const expired = jwt.sign({ id: 7, role: "AGENT" }, env.JWT_SECRET, { algorithm: "HS256", expiresIn: -10 });
    const err = await run(authenticate, { headers: { authorization: `Bearer ${expired}` } });
    assert.equal(err.statusCode, 401);
    assert.match(err.message, /expired/i);
});

test(
    "authenticate: valid token loads the user (role comes from the database, not the token)",
    withUser({ ...agent, role: "AGENT" }, async () => {
        const staleAdminToken = signToken({ id: 7, role: "ADMIN" });
        const req = { headers: { authorization: `Bearer ${staleAdminToken}` } };
        const err = await run(authenticate, req);
        assert.equal(err, undefined);
        assert.deepEqual(req.user, agent);
    })
);

test(
    "authenticate: token of a deleted user -> 401",
    withUser(null, async () => {
        const err = await run(authenticate, { headers: { authorization: `Bearer ${signToken(agent)}` } });
        assert.equal(err.statusCode, 401);
    })
);

test("authorize: role checks", () => {
    const onlyAdmin = authorize("ADMIN");
    const next = (req) => {
        let result;
        onlyAdmin(req, {}, (err) => (result = err));
        return result;
    };

    assert.equal(next({}).statusCode, 401);
    assert.equal(next({ user: { role: "USER" } }).statusCode, 403);
    assert.equal(next({ user: { role: "AGENT" } }).statusCode, 403);
    assert.equal(next({ user: { role: "ADMIN" } }), undefined);
});

test("DTOs never expose the password hash", () => {
    const dto = toUserDTO({ id: 1, name: "A", email: "a@x.com", role: "USER", passwordHash: "secret" });
    assert.equal("passwordHash" in dto, false);
    assert.equal(JSON.stringify(dto).includes("secret"), false);
});

test("ticket DTO only includes events when they are provided", () => {
    const ticket = { id: 1, subject: "s", events: [{ id: 99 }], assignee: null };
    assert.equal("events" in toTicketDTO(ticket), false);
    assert.equal(toTicketDTO(ticket, []).events.length, 0);
});

const respond = (err) => {
    let status;
    let body;
    errorHandler(err, {}, { headersSent: false, status(s) { status = s; return this; }, json(b) { body = b; return this; } }, () => {});
    return { status, body };
};

test("error handler: unique violations -> 409, unexpected errors are not leaked", () => {
    const original = console.error;
    console.error = () => {};
    try {
        assert.equal(respond({ name: "SequelizeUniqueConstraintError" }).status, 409);

        const result = respond(new Error("SELECT secret FROM somewhere failed"));
        assert.equal(result.status, 500);
        assert.equal(result.body.message, "Internal Server Error");
        assert.equal("stack" in result.body, false);
    } finally {
        console.error = original;
    }
});

test("error handler: database trigger rejection -> 405", () => {
    const result = respond({ name: "SequelizeDatabaseError", parent: { sqlState: "45000" } });
    assert.equal(result.status, 405);
});

test("audit events cannot be updated or deleted through the model layer", async () => {
    await assert.rejects(() => TicketEvent.update({ newValue: "x" }, { where: { id: 1 } }), /immutable/i);
    await assert.rejects(() => TicketEvent.destroy({ where: { id: 1 } }), /immutable/i);
});

test("env validation fails clearly when secrets are missing or weak", () => {
    const envModule = pathToFileURL(path.resolve(__dirname, "../../src/config/env.js")).href;
    const script = `import(${JSON.stringify(envModule)})`;
    const base = { ...process.env, DOTENV_CONFIG_QUIET: "true" };

    const missing = { ...base };
    delete missing.JWT_SECRET;
    let result = spawnSync(process.execPath, ["-e", script], { env: missing, encoding: "utf8", cwd: path.resolve(__dirname, "../support") });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /JWT_SECRET/);

    result = spawnSync(process.execPath, ["-e", script], { env: { ...base, JWT_SECRET: "short" }, encoding: "utf8", cwd: path.resolve(__dirname, "../support") });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /at least 32/);
    assert.equal(result.stderr.includes("short\n"), false);
});
