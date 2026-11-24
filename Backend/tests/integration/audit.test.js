import integrationSetup from "../support/integration-setup.js";
import assert from "node:assert/strict";
import test from "node:test";

const { setup, teardown, resetDb, makeUser, api, importTicket, isMysql, models } = integrationSetup;

let agent;
let admin;
let ticketId;

test.before(setup);
test.after(teardown);
test.beforeEach(async () => {
    await resetDb();
    agent = await makeUser("AGENT");
    admin = await makeUser("ADMIN");

    const res = await importTicket(agent.token, "AUD-1", "Payment failed", "Money deducted");
    ticketId = res.body.data.ticket.id; // BILLING / MEDIUM / OPEN
});

const patch = (token, body) => api("PATCH", `/api/tickets/${ticketId}`, { token, body });
const events = async () => (await api("GET", `/api/tickets/${ticketId}/events`, { token: agent.token })).body.data.events;
const summary = (list) => list.map((e) => [e.field, e.oldValue, e.newValue, e.actor]);

test("category, priority and status changes each create an event with the authenticated actor", async () => {
    assert.equal((await patch(agent.token, { category: "BUG" })).status, 200);
    assert.equal((await patch(agent.token, { priority: "HIGH" })).status, 200);
    assert.equal((await patch(admin.token, { status: "IN_PROGRESS" })).status, 200);

    assert.deepEqual(summary(await events()), [
        ["category", "BILLING", "BUG", agent.email],
        ["priority", "MEDIUM", "HIGH", agent.email],
        ["status", "OPEN", "IN_PROGRESS", admin.email],
    ]);
});

test("one request changing several fields writes one event per changed field", async () => {
    const res = await patch(agent.token, { category: "BUG", priority: "HIGH", status: "RESOLVED" });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.ticket.isHumanOverride, true);
    assert.deepEqual(
        summary(await events()).map((e) => e[0]).sort(),
        ["category", "priority", "status"]
    );
});

test("unchanged values do not create events", async () => {
    assert.equal((await patch(agent.token, { status: "OPEN", priority: "MEDIUM", category: "BILLING" })).status, 200);
    assert.equal((await events()).length, 0);

    // Only the genuinely changed field is recorded.
    await patch(agent.token, { status: "OPEN", priority: "URGENT" });
    assert.deepEqual(summary(await events()), [["priority", "MEDIUM", "URGENT", agent.email]]);

    // Sending the same value again adds nothing.
    await patch(agent.token, { priority: "URGENT" });
    assert.equal((await events()).length, 1);
});

test("setting the category to its current value does not claim a human override", async () => {
    const res = await patch(agent.token, { category: "BILLING" });
    assert.equal(res.body.data.ticket.isHumanOverride, false);
});

test("marking as reviewed updates the ticket without an audit event", async () => {
    const res = await patch(agent.token, { isReviewed: true });
    assert.equal(res.body.data.ticket.isReviewed, true);
    assert.equal((await events()).length, 0);
});

test("assignee changes are audited with readable names; invalid assignees are rejected", async () => {
    const assigned = await patch(agent.token, { assigneeId: agent.user.id });
    assert.equal(assigned.status, 200);
    assert.equal(assigned.body.data.ticket.assignee.id, agent.user.id);

    await patch(agent.token, { assigneeId: null });

    const list = await events();
    assert.deepEqual(summary(list), [
        ["assigneeId", null, String(agent.user.id), agent.email],
        ["assigneeId", String(agent.user.id), null, agent.email],
    ]);
    assert.equal(list[0].newLabel, agent.user.name);
    assert.equal(list[1].newLabel, "Unassigned");

    const plainUser = await makeUser("USER");
    assert.equal((await patch(agent.token, { assigneeId: plainUser.user.id })).status, 400);
    assert.equal((await patch(agent.token, { assigneeId: 999999 })).status, 400);
    assert.equal((await events()).length, 2, "rejected updates must not add events");
});

test("ticket detail returns the history oldest-first, read-only DTO fields only", async () => {
    await patch(agent.token, { status: "IN_PROGRESS" });
    await patch(agent.token, { status: "RESOLVED" });

    const detail = await api("GET", `/api/tickets/${ticketId}`, { token: agent.token });
    const list = detail.body.data.ticket.events;

    assert.deepEqual(list.map((e) => e.newValue), ["IN_PROGRESS", "RESOLVED"]);
    const times = list.map((e) => new Date(e.createdAt).getTime());
    assert.deepEqual(times, [...times].sort((a, b) => a - b));
    assert.deepEqual(
        Object.keys(list[0]).sort(),
        ["actor", "createdAt", "field", "id", "newLabel", "newValue", "oldLabel", "oldValue", "ticketId"]
    );
});

test("a failed update leaves neither a changed ticket nor partial audit records (single transaction)", async () => {
    const repository = (await import("../../src/repositories/ticket-event.repository.js")).default;
    const original = repository.createMany;
    const originalConsoleError = console.error;

    repository.createMany = async () => {
        throw new Error("simulated audit write failure");
    };
    console.error = () => {};

    try {
        const res = await patch(agent.token, { category: "BUG", status: "RESOLVED" });
        assert.equal(res.status, 500);
    } finally {
        repository.createMany = original;
        console.error = originalConsoleError;
    }

    const detail = await api("GET", `/api/tickets/${ticketId}`, { token: agent.token });
    assert.equal(detail.body.data.ticket.status, "OPEN");
    assert.equal(detail.body.data.ticket.category, "BILLING");
    assert.equal(detail.body.data.ticket.isHumanOverride, false);
    assert.equal(detail.body.data.ticket.events.length, 0);
});

test("authorization failures and unknown tickets write nothing", async () => {
    const user = await makeUser("USER");
    assert.equal((await patch(user.token, { status: "RESOLVED" })).status, 403);
    assert.equal((await api("PATCH", "/api/tickets/999999", { token: agent.token, body: { status: "RESOLVED" } })).status, 404);
    assert.equal((await patch(agent.token, {})).status, 400);
    assert.equal((await patch(agent.token, { status: "DONE" })).status, 400);
    assert.equal((await events()).length, 0);
});

test("there is no API to modify or delete audit events", async () => {
    await patch(agent.token, { status: "RESOLVED" });
    const [event] = await events();

    for (const [method, path] of [
        ["PATCH", `/api/tickets/${ticketId}/events/${event.id}`],
        ["PUT", `/api/tickets/${ticketId}/events/${event.id}`],
        ["DELETE", `/api/tickets/${ticketId}/events/${event.id}`],
        ["DELETE", `/api/tickets/${ticketId}/events`],
        ["POST", `/api/tickets/${ticketId}/events`],
        ["PATCH", `/api/tickets/${ticketId}/events`],
        ["PUT", `/api/tickets/${ticketId}/events`],
    ]) {
        const res = await api(method, path, { token: admin.token, body: { newValue: "tampered" } });
        assert.ok([404, 405].includes(res.status), `${method} ${path} -> ${res.status}`);
    }

    assert.deepEqual(summary(await events()), [["status", "OPEN", "RESOLVED", agent.email]]);
});

test("the model layer refuses to modify or delete events", async () => {
    const { TicketEvent } = models;
    await patch(agent.token, { status: "RESOLVED" });

    await assert.rejects(() => TicketEvent.update({ newValue: "x" }, { where: { ticketId } }), /immutable/i);
    await assert.rejects(() => TicketEvent.destroy({ where: { ticketId } }), /immutable/i);

    const row = await TicketEvent.findOne({ where: { ticketId } });
    row.newValue = "tampered";
    await assert.rejects(() => row.save(), /immutable/i);
    await assert.rejects(() => row.destroy(), /immutable/i);
});

test("deleting a ticket is a soft delete: it disappears from the API but its audit history is kept", async () => {
    const { TicketEvent } = models;
    await patch(agent.token, { status: "RESOLVED" });

    assert.equal((await api("DELETE", `/api/tickets/${ticketId}`, { token: admin.token })).status, 200);
    assert.equal((await api("GET", `/api/tickets/${ticketId}`, { token: admin.token })).status, 404);
    assert.equal((await api("GET", `/api/tickets/${ticketId}/events`, { token: admin.token })).status, 404);
    assert.equal((await api("PATCH", `/api/tickets/${ticketId}`, { token: admin.token, body: { status: "OPEN" } })).status, 404);

    const list = await api("GET", "/api/tickets", { token: admin.token });
    assert.equal(list.body.data.pagination.total, 0);

    assert.equal(await TicketEvent.count({ where: { ticketId } }), 1);
});

test("MySQL only: database triggers block UPDATE/DELETE on ticket_events", { skip: !isMysql() && "requires MySQL" }, async () => {
    const { sequelize } = models;
    await patch(agent.token, { status: "RESOLVED" });

    await assert.rejects(() => sequelize.query("UPDATE ticket_events SET new_value = 'tampered'"), /immutable/i);
    await assert.rejects(() => sequelize.query("DELETE FROM ticket_events"), /immutable/i);
    assert.equal((await events()).length, 1);
});

test("MySQL only: a ticket with events cannot be hard-deleted (RESTRICT foreign key)", { skip: !isMysql() && "requires MySQL" }, async () => {
    const { sequelize } = models;
    await patch(agent.token, { status: "RESOLVED" });

    await assert.rejects(() => sequelize.query(`DELETE FROM tickets WHERE id = ${ticketId}`));
    assert.equal((await events()).length, 1);
});
