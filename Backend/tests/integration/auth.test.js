import integrationSetup from "../support/integration-setup.js";
import jwt from "jsonwebtoken";
import assert from "node:assert/strict";
import test from "node:test";

const { setup, teardown, resetDb, makeUser, api, importTicket } = integrationSetup;

test.before(setup);
test.after(teardown);
test.beforeEach(resetDb);

test("register creates a USER, ignores a supplied role and never returns the password hash", async () => {
    const res = await api("POST", "/api/auth/register", {
        body: { name: "Eve Example", email: "Eve@Example.com", password: "password123", role: "ADMIN" },
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.user.role, "USER");
    assert.equal(res.body.data.user.email, "eve@example.com");

    const raw = JSON.stringify(res.body);
    assert.equal(/passwordHash|password_hash|password123/.test(raw), false);
});

test("register rejects duplicate emails and weak passwords", async () => {
    const payload = { name: "Eve Example", email: "eve@example.com", password: "password123" };
    assert.equal((await api("POST", "/api/auth/register", { body: payload })).status, 201);
    assert.equal((await api("POST", "/api/auth/register", { body: payload })).status, 409);
    assert.equal((await api("POST", "/api/auth/register", { body: { ...payload, email: "x@example.com", password: "short" } })).status, 400);
});

test("login works with valid credentials and /me returns the current user", async () => {
    await api("POST", "/api/auth/register", {
        body: { name: "Eve Example", email: "eve@example.com", password: "password123" },
    });

    const login = await api("POST", "/api/auth/login", { body: { email: "EVE@example.com", password: "password123" } });
    assert.equal(login.status, 200);
    assert.ok(login.body.data.token);
    assert.equal(JSON.stringify(login.body).includes("passwordHash"), false);

    const me = await api("GET", "/api/auth/me", { token: login.body.data.token });
    assert.equal(me.status, 200);
    assert.equal(me.body.data.user.email, "eve@example.com");
});

test("invalid credentials are rejected with the same message for unknown email and wrong password", async () => {
    await api("POST", "/api/auth/register", {
        body: { name: "Eve Example", email: "eve@example.com", password: "password123" },
    });

    const wrongPassword = await api("POST", "/api/auth/login", { body: { email: "eve@example.com", password: "nope-nope" } });
    const unknownEmail = await api("POST", "/api/auth/login", { body: { email: "ghost@example.com", password: "password123" } });

    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownEmail.status, 401);
    assert.equal(wrongPassword.body.message, unknownEmail.body.message);
});

test("missing, malformed and expired tokens are rejected", async () => {
    assert.equal((await api("GET", "/api/tickets")).status, 401);
    assert.equal((await api("GET", "/api/tickets", { token: "garbage" })).status, 401);

    const { user } = await makeUser("AGENT");
    const expired = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { algorithm: "HS256", expiresIn: -5 });
    const res = await api("GET", "/api/tickets", { token: expired });
    assert.equal(res.status, 401);
    assert.match(res.body.message, /expired/i);
});

test("a token for a deleted user stops working", async () => {
    const { user, token } = await makeUser("AGENT");
    await user.destroy();
    assert.equal((await api("GET", "/api/tickets", { token })).status, 401);
});

test("role matrix: USER is read-only, AGENT can triage, only ADMIN can delete", async () => {
    const admin = await makeUser("ADMIN");
    const agent = await makeUser("AGENT");
    const user = await makeUser("USER");

    const seeded = await importTicket(agent.token, "ROLE-1", "Refund please", "Charge twice");
    const id = seeded.body.data.ticket.id;

    // USER: can read, cannot write
    assert.equal((await api("GET", "/api/tickets", { token: user.token })).status, 200);
    assert.equal((await api("GET", `/api/tickets/${id}`, { token: user.token })).status, 200);
    assert.equal((await api("POST", "/api/tickets", { token: user.token, body: { subject: "x", body: "y" } })).status, 403);
    assert.equal((await importTicket(user.token, "ROLE-2", "x", "y")).status, 403);
    assert.equal((await api("PATCH", `/api/tickets/${id}`, { token: user.token, body: { status: "RESOLVED" } })).status, 403);
    assert.equal((await api("DELETE", `/api/tickets/${id}`, { token: user.token })).status, 403);

    // AGENT: can create/update, cannot delete
    assert.equal((await api("POST", "/api/tickets", { token: agent.token, body: { subject: "x", body: "y" } })).status, 201);
    assert.equal((await api("PATCH", `/api/tickets/${id}`, { token: agent.token, body: { status: "RESOLVED" } })).status, 200);
    assert.equal((await api("DELETE", `/api/tickets/${id}`, { token: agent.token })).status, 403);

    // ADMIN: can delete
    assert.equal((await api("DELETE", `/api/tickets/${id}`, { token: admin.token })).status, 200);
    assert.equal((await api("GET", `/api/tickets/${id}`, { token: admin.token })).status, 404);
});

test("user management: ADMIN-only, assignable list, role changes", async () => {
    const admin = await makeUser("ADMIN");
    const agent = await makeUser("AGENT");
    const user = await makeUser("USER");

    assert.equal((await api("GET", "/api/users", { token: user.token })).status, 403);
    assert.equal((await api("GET", "/api/users", { token: agent.token })).status, 403);
    assert.equal((await api("GET", "/api/users", { token: admin.token })).status, 200);
    assert.equal((await api("GET", "/api/users/assignable", { token: user.token })).status, 403);

    const assignable = await api("GET", "/api/users/assignable", { token: agent.token });
    assert.equal(assignable.status, 200);
    assert.deepEqual(assignable.body.data.users.map((u) => u.role).sort(), ["ADMIN", "AGENT"]);

    const promote = await api("PATCH", `/api/users/${user.user.id}/role`, { token: admin.token, body: { role: "AGENT" } });
    assert.equal(promote.status, 200);
    assert.equal(promote.body.data.user.role, "AGENT");

    // The role is read from the database on every request, so it applies immediately.
    assert.equal((await api("POST", "/api/tickets", { token: user.token, body: { subject: "x", body: "y" } })).status, 201);

    assert.equal((await api("PATCH", `/api/users/${admin.user.id}/role`, { token: admin.token, body: { role: "USER" } })).status, 400);
    assert.equal((await api("PATCH", `/api/users/${agent.user.id}/role`, { token: admin.token, body: { role: "ROOT" } })).status, 400);
    assert.equal((await api("PATCH", `/api/users/${agent.user.id}/role`, { token: agent.token, body: { role: "ADMIN" } })).status, 403);
});
