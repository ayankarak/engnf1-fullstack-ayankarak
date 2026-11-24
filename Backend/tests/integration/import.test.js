import integrationSetup from "../support/integration-setup.js";
import assert from "node:assert/strict";
import test from "node:test";

const { setup, teardown, resetDb, makeUser, api, importTicket, models } = integrationSetup;

let agent;
let admin;

test.before(setup);
test.after(teardown);
test.beforeEach(async () => {
    await resetDb();
    agent = await makeUser("AGENT");
    admin = await makeUser("ADMIN");
});

const countTickets = async () => {
    const { Ticket } = models;
    return await Ticket.count({ paranoid: false });
};

const eventsOf = async (ticketId) =>
    (await api("GET", `/api/tickets/${ticketId}/events`, { token: agent.token })).body.data.events;

test("first import creates (201), second import with the same externalId does not duplicate (200)", async () => {
    const payload = ["TICKET-101", "Payment failed", "Money deducted but order not confirmed"];

    const first = await importTicket(agent.token, ...payload);
    assert.equal(first.status, 201);
    assert.equal(first.body.data.created, true);
    assert.equal(first.body.data.ticket.category, "BILLING");
    assert.equal(first.body.data.ticket.autoCategory, "BILLING");
    assert.equal(first.body.data.ticket.isHumanOverride, false);

    const second = await importTicket(agent.token, ...payload);
    assert.equal(second.status, 200);
    assert.equal(second.body.data.created, false);
    assert.equal(second.body.data.ticket.id, first.body.data.ticket.id);
    assert.equal(await countTickets(), 1);
});

test("spec classification examples through the API", async () => {
    const cases = [
        ["C-1", "Package not arrived", "My package has not arrived.", "DELIVERY", "HIGH"],
        ["C-2", "Payment refund", "I want a refund", "BILLING", "HIGH"],
        ["C-3", "Login locked out", "I cannot get in", "LOGIN", "URGENT"],
        ["C-4", "General suggestion", "It would be nice to have tags", "FEATURE_REQUEST", "MEDIUM"],
    ];

    for (const [externalId, subject, body, category, priority] of cases) {
        const res = await importTicket(agent.token, externalId, subject, body);
        assert.equal(res.body.data.ticket.category, category, externalId);
        assert.equal(res.body.data.ticket.priority, priority, externalId);
    }
});

test("a human category override survives re-import while autoCategory keeps updating", async () => {
    const first = await importTicket(agent.token, "OVR-1", "Payment failed", "charge happened twice");
    const id = first.body.data.ticket.id;
    assert.equal(first.body.data.ticket.category, "BILLING");

    const patched = await api("PATCH", `/api/tickets/${id}`, { token: agent.token, body: { category: "LOGIN" } });
    assert.equal(patched.body.data.ticket.category, "LOGIN");
    assert.equal(patched.body.data.ticket.isHumanOverride, true);

    const again = await importTicket(agent.token, "OVR-1", "Package missing", "tracking number does not work");
    assert.equal(again.status, 200);
    assert.equal(again.body.data.ticket.category, "LOGIN", "manual category must be preserved");
    assert.equal(again.body.data.ticket.autoCategory, "DELIVERY", "automatic category must still update");
    assert.equal(again.body.data.ticket.isHumanOverride, true);
    assert.equal(again.body.data.ticket.subject, "Package missing");
});

test("without an override, re-import re-classifies and the change is audited as system:import", async () => {
    const first = await importTicket(agent.token, "RE-1", "Package missing", "where is it");
    const id = first.body.data.ticket.id;
    assert.equal(first.body.data.ticket.category, "DELIVERY");
    assert.equal(first.body.data.ticket.priority, "MEDIUM");

    const again = await importTicket(agent.token, "RE-1", "Refund please", "I want a refund");
    assert.equal(again.body.data.ticket.category, "BILLING");
    assert.equal(again.body.data.ticket.autoCategory, "BILLING");
    assert.equal(again.body.data.ticket.priority, "HIGH");

    const events = await eventsOf(id);
    assert.deepEqual(
        events.map((e) => [e.field, e.oldValue, e.newValue, e.actor]),
        [
            ["category", "DELIVERY", "BILLING", "system:import"],
            ["priority", "MEDIUM", "HIGH", "system:import"],
        ]
    );
});

test("an unchanged re-import is a no-op: it neither reverts agent edits nor writes events", async () => {
    const first = await importTicket(agent.token, "NOOP-1", "General question", "just curious");
    const id = first.body.data.ticket.id;

    await api("PATCH", `/api/tickets/${id}`, { token: agent.token, body: { priority: "URGENT", status: "IN_PROGRESS" } });
    const eventsBefore = (await eventsOf(id)).length;

    const again = await importTicket(agent.token, "NOOP-1", "General question", "just curious");
    assert.equal(again.body.data.ticket.priority, "URGENT");
    assert.equal(again.body.data.ticket.status, "IN_PROGRESS");
    assert.equal((await eventsOf(id)).length, eventsBefore);
});

test("concurrent imports of the same externalId create exactly one ticket", async () => {
    const results = await Promise.all(
        Array.from({ length: 20 }, () => importTicket(agent.token, "RACE-1", "Payment failed", "same body"))
    );

    const statuses = results.map((r) => r.status);
    assert.ok(statuses.every((s) => s === 200 || s === 201), `unexpected statuses: ${statuses}`);
    assert.equal(statuses.filter((s) => s === 201).length, 1, "exactly one request creates the ticket");
    assert.equal(new Set(results.map((r) => r.body.data.ticket.id)).size, 1);
    assert.equal(await countTickets(), 1);
});

test("concurrent imports with different content never duplicate or fail", async () => {
    const results = await Promise.all(
        Array.from({ length: 12 }, (_, i) => importTicket(agent.token, "RACE-2", `Subject ${i}`, `Body ${i}`))
    );

    const statuses = results.map((r) => r.status);
    assert.ok(statuses.every((s) => s === 200 || s === 201), `unexpected statuses: ${statuses}`);
    assert.equal(await countTickets(), 1);
});

test("re-importing a deleted ticket is refused (409) and does not create a duplicate", async () => {
    const first = await importTicket(agent.token, "DEL-1", "Payment failed", "x");
    await api("DELETE", `/api/tickets/${first.body.data.ticket.id}`, { token: admin.token });

    const again = await importTicket(agent.token, "DEL-1", "Payment failed", "x");
    assert.equal(again.status, 409);
    assert.equal(await countTickets(), 1);
});

test("import validation and authentication", async () => {
    assert.equal((await api("POST", "/api/tickets/import", { token: agent.token, body: { subject: "a", body: "b" } })).status, 400);
    assert.equal((await api("POST", "/api/tickets/import", { token: agent.token, body: { externalId: "X", subject: "", body: "b" } })).status, 400);
    assert.equal((await api("POST", "/api/tickets/import", { body: { externalId: "X", subject: "a", body: "b" } })).status, 401);
    assert.equal(await countTickets(), 0);
});

test("manual create generates an externalId and ignores client-supplied category/priority", async () => {
    const res = await api("POST", "/api/tickets", {
        token: agent.token,
        body: { subject: "Invoice wrong", body: "see attached", category: "BUG", priority: "URGENT" },
    });

    assert.equal(res.status, 201);
    assert.match(res.body.data.ticket.externalId, /^MANUAL-/);
    assert.equal(res.body.data.ticket.category, "BILLING");
    assert.equal(res.body.data.ticket.priority, "MEDIUM");
});
