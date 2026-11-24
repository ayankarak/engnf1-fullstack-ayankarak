import integrationSetup from "../support/integration-setup.js";
import assert from "node:assert/strict";
import test from "node:test";

const { setup, teardown, resetDb, makeUser, api, isMysql, models } = integrationSetup;

let agent;
let admin;

const SEEDS = [
    ["S-1", "App crash on startup", "The app crashes right after the splash screen", "BUG", "HIGH", "OPEN"],
    ["S-2", "Search page broken", "Typing in search causes a crash", "BUG", "MEDIUM", "OPEN"],
    ["S-3", "Export fails", "Exception thrown during CSV export, crash dump attached", "BUG", "HIGH", "RESOLVED"],
    ["S-4", "Refund needed", "Charged twice", "BILLING", "HIGH", "OPEN"],
    ["S-5", "Invoice question", "Where do I download my invoice?", "BILLING", "MEDIUM", "IN_PROGRESS"],
    ["S-6", "Locked out", "Cannot sign in", "LOGIN", "URGENT", "OPEN"],
    ["S-7", "Package late", "Tracking has not updated", "DELIVERY", "HIGH", "CLOSED"],
    ["S-8", "Dark mode", "Please add a dark theme", "FEATURE_REQUEST", "MEDIUM", "OPEN"],
    ["S-9", "100% sure", "pricing", "FEATURE_REQUEST", "MEDIUM", "OPEN"],
    ["S-10", "1000 users", "scale", "FEATURE_REQUEST", "MEDIUM", "OPEN"],
    ["S-11", "snake_case names", "naming", "FEATURE_REQUEST", "LOW", "OPEN"],
    ["S-12", "snakeXcase names", "naming", "FEATURE_REQUEST", "LOW", "OPEN"],
];

test.before(setup);
test.after(teardown);
test.beforeEach(async () => {
    await resetDb();
    agent = await makeUser("AGENT");
    admin = await makeUser("ADMIN");

    const { Ticket } = models;
    for (const [externalId, subject, body, category, priority, status] of SEEDS) {
        // Sequential on purpose so ids follow the seed order.
        await Ticket.create({ externalId, subject, body, autoCategory: category, category, priority, status });
    }
});

const search = async (query, token = agent.token) => {
    const res = await api("GET", `/api/tickets?${new URLSearchParams(query)}`, { token });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    return res.body.data;
};
const ids = (data) => data.tickets.map((t) => t.externalId).sort();

test("each filter works on its own", async () => {
    assert.equal((await search({ status: "OPEN" })).pagination.total, 9);
    assert.equal((await search({ status: "CLOSED" })).pagination.total, 1);
    assert.equal((await search({ category: "BUG" })).pagination.total, 3);
    assert.equal((await search({ category: "FEATURE_REQUEST" })).pagination.total, 5);
    assert.equal((await search({ priority: "HIGH" })).pagination.total, 4);
    assert.equal((await search({ priority: "URGENT" })).pagination.total, 1);
    assert.equal((await search({ q: "crash" })).pagination.total, 3);
});

test("combined filters use AND logic", async () => {
    assert.deepEqual(ids(await search({ category: "BUG", priority: "HIGH", q: "crash" })), ["S-1", "S-3"]);
    assert.deepEqual(ids(await search({ category: "BUG", priority: "HIGH", q: "crash", status: "OPEN" })), ["S-1"]);
    assert.equal((await search({ category: "BILLING", priority: "URGENT" })).pagination.total, 0);
    assert.equal((await search({ category: "BUG", q: "refund" })).pagination.total, 0);
});

test("search covers subject and body, case-insensitively, as a substring", async () => {
    assert.deepEqual(ids(await search({ q: "splash" })), ["S-1"]); // body only
    assert.deepEqual(ids(await search({ q: "Refund" })), ["S-4"]); // subject only
    assert.deepEqual(ids(await search({ q: "CRASH" })), ["S-1", "S-2", "S-3"]);
    assert.deepEqual(ids(await search({ q: "plash scr" })), ["S-1"]);
});

test("assignee filter", async () => {
    const { Ticket } = models;
    await Ticket.update({ assigneeId: agent.user.id }, { where: { externalId: ["S-1", "S-4"] } });
    assert.deepEqual(ids(await search({ assigneeId: agent.user.id })), ["S-1", "S-4"]);

    const data = await search({ assigneeId: agent.user.id });
    assert.equal(data.tickets[0].assignee.email, agent.email, "list items include the assignee");
});

test("LIKE wildcards in the query are matched literally (MySQL)", { skip: !isMysql() && "requires MySQL (LIKE escaping)" }, async () => {
    assert.deepEqual(ids(await search({ q: "100%" })), ["S-9"]);
    assert.deepEqual(ids(await search({ q: "snake_case" })), ["S-11"]);
    assert.deepEqual(ids(await search({ q: "%" })), ["S-9"]);
    assert.equal((await search({ q: "\\" })).pagination.total, 0);
});

test("SQL injection attempts are inert", async () => {
    for (const q of ["' OR '1'='1", "'; DROP TABLE tickets; --", "\" OR 1=1 --", "x' UNION SELECT * FROM users --"]) {
        const data = await search({ q });
        assert.equal(data.pagination.total, 0, q);
    }

    // The table is intact and unfiltered listing still returns everything.
    assert.equal((await search({})).pagination.total, 12);

    // Injection through enum filters is rejected by validation.
    const res = await api("GET", `/api/tickets?${new URLSearchParams({ status: "OPEN' OR '1'='1" })}`, { token: agent.token });
    assert.equal(res.status, 400);
});

test("pagination: total, page, limit, totalPages, ordering and bounds", async () => {
    const first = await search({ limit: "5", page: "1" });
    assert.deepEqual(first.pagination, { total: 12, page: 1, limit: 5, totalPages: 3 });
    assert.equal(first.tickets.length, 5);

    const last = await search({ limit: "5", page: "3" });
    assert.equal(last.tickets.length, 2);

    const beyond = await search({ limit: "5", page: "4" });
    assert.equal(beyond.tickets.length, 0);
    assert.equal(beyond.pagination.total, 12);

    const seen = [];
    for (const page of [1, 2, 3]) seen.push(...(await search({ limit: "5", page: String(page) })).tickets.map((t) => t.id));
    assert.equal(new Set(seen).size, 12, "pages never repeat or skip rows");

    const asc = await search({ limit: "3", sortOrder: "asc" });
    const desc = await search({ limit: "3", sortOrder: "desc" });
    assert.deepEqual(asc.tickets.map((t) => t.externalId), ["S-1", "S-2", "S-3"]);
    assert.deepEqual(desc.tickets.map((t) => t.externalId), ["S-12", "S-11", "S-10"]);

    // Filters are applied before pagination.
    const bugs = await search({ category: "BUG", limit: "2", page: "2" });
    assert.deepEqual(bugs.pagination, { total: 3, page: 2, limit: 2, totalPages: 2 });
    assert.equal(bugs.tickets.length, 1);

    for (const bad of [{ limit: "101" }, { limit: "0" }, { page: "0" }, { page: "abc" }]) {
        const res = await api("GET", `/api/tickets?${new URLSearchParams(bad)}`, { token: agent.token });
        assert.equal(res.status, 400, JSON.stringify(bad));
    }
});

test("list items omit the audit trail; USER role can read", async () => {
    const user = await makeUser("USER");
    const data = await search({ limit: "2" }, user.token);
    assert.equal("events" in data.tickets[0], false);
    assert.equal("passwordHash" in (data.tickets[0].assignee || {}), false);
});

test("dashboard stats count tickets by status and urgent priority and ignore deleted tickets", async () => {
    const stats = async () => (await api("GET", "/api/tickets/stats", { token: agent.token })).body.data.stats;

    assert.deepEqual(await stats(), { total: 12, open: 9, inProgress: 1, resolved: 1, closed: 1, urgent: 1 });

    const urgent = (await search({ priority: "URGENT" })).tickets[0];
    await api("DELETE", `/api/tickets/${urgent.id}`, { token: admin.token });

    assert.deepEqual(await stats(), { total: 11, open: 8, inProgress: 1, resolved: 1, closed: 1, urgent: 0 });
});

test("ticket detail validation", async () => {
    assert.equal((await api("GET", "/api/tickets/abc", { token: agent.token })).status, 400);
    assert.equal((await api("GET", "/api/tickets/999999", { token: agent.token })).status, 404);
    assert.equal((await api("GET", "/api/tickets/999999/events", { token: agent.token })).status, 404);
});
