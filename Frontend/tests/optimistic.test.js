import test from "node:test";
import assert from "node:assert/strict";

import {
    adjustStats,
    applyTicketPatch,
    buildProvisionalEvents,
    createPendingGuard,
    diffPatch,
    runOptimistic,
} from "../src/utils/optimistic.js";

const ticket = {
    id: 5,
    status: "OPEN",
    priority: "MEDIUM",
    category: "BILLING",
    autoCategory: "BILLING",
    isHumanOverride: false,
    assigneeId: null,
    assignee: null,
    isReviewed: false,
};

const stats = { total: 10, open: 6, inProgress: 2, resolved: 1, closed: 1, urgent: 1 };

test("runOptimistic: applies immediately, keeps the result on success", async () => {
    const log = [];
    let resolveRequest;

    const pending = runOptimistic({
        apply: () => { log.push("apply"); return "snapshot"; },
        request: () => new Promise((resolve) => { resolveRequest = resolve; }),
        commit: (result, snapshot) => log.push(`commit:${result}:${snapshot}`),
        rollback: () => log.push("rollback"),
    });

    // The UI was updated before the request finished.
    assert.deepEqual(log, ["apply"]);

    resolveRequest("server");
    const outcome = await pending;

    assert.deepEqual(log, ["apply", "commit:server:snapshot"]);
    assert.equal(outcome.ok, true);
});

test("runOptimistic: restores the previous state and reports the error on failure", async () => {
    const log = [];
    const failure = new Error("boom");

    const outcome = await runOptimistic({
        apply: () => { log.push("apply"); return { previous: 1 }; },
        request: async () => { throw failure; },
        commit: () => log.push("commit"),
        rollback: (snapshot, error) => log.push(`rollback:${snapshot.previous}:${error.message}`),
    });

    assert.deepEqual(log, ["apply", "rollback:1:boom"]);
    assert.equal(outcome.ok, false);
    assert.equal(outcome.error, failure);
});

test("a UI state machine ends up consistent after success and after failure", async () => {
    let state = { ...ticket };

    const change = (patch, request) =>
        runOptimistic({
            apply: () => { const before = state; state = applyTicketPatch(state, patch); return before; },
            request,
            commit: (result) => { state = result; },
            rollback: (before) => { state = before; },
        });

    await change({ status: "RESOLVED" }, async () => ({ ...ticket, status: "RESOLVED", version: "server" }));
    assert.equal(state.status, "RESOLVED");
    assert.equal(state.version, "server");

    const resolved = state;
    await change({ status: "CLOSED" }, async () => { throw new Error("offline"); });
    assert.equal(state, resolved, "failed update restores the exact previous object");
});

test("pending guard blocks duplicate requests per key only", () => {
    const guard = createPendingGuard();

    assert.equal(guard.tryStart(1), true);
    assert.equal(guard.tryStart(1), false);
    assert.equal(guard.tryStart(2), true);
    assert.deepEqual([...guard.keys()].sort(), [1, 2]);

    guard.finish(1);
    assert.equal(guard.has(1), false);
    assert.equal(guard.tryStart(1), true);
});

test("applyTicketPatch mirrors server behaviour", () => {
    assert.equal(applyTicketPatch(ticket, { status: "RESOLVED" }).status, "RESOLVED");
    assert.equal(applyTicketPatch(ticket, { status: "RESOLVED" }).isHumanOverride, false);
    assert.equal(applyTicketPatch(ticket, { category: "BUG" }).isHumanOverride, true);
    assert.equal(applyTicketPatch(ticket, { category: "BILLING" }).isHumanOverride, false);

    const users = [{ id: 9, name: "Ann", email: "ann@example.com", role: "AGENT" }];
    assert.deepEqual(applyTicketPatch(ticket, { assigneeId: 9 }, users).assignee, { id: 9, name: "Ann", email: "ann@example.com" });
    assert.equal(applyTicketPatch({ ...ticket, assigneeId: 9, assignee: users[0] }, { assigneeId: null }).assignee, null);
    assert.equal(applyTicketPatch(ticket, { assigneeId: 77 }, users).assignee.name, "User #77");

    assert.equal(ticket.status, "OPEN", "input is not mutated");
});

test("adjustStats moves counters between buckets", () => {
    const resolved = adjustStats(stats, ticket, { ...ticket, status: "RESOLVED" });
    assert.deepEqual(resolved, { ...stats, open: 5, resolved: 2 });

    const urgent = adjustStats(stats, ticket, { ...ticket, priority: "URGENT" });
    assert.equal(urgent.urgent, 2);

    const notUrgent = adjustStats(stats, { ...ticket, priority: "URGENT" }, { ...ticket, priority: "HIGH" });
    assert.equal(notUrgent.urgent, 0);

    assert.deepEqual(adjustStats(stats, ticket, { ...ticket, category: "BUG" }), stats);
    assert.equal(adjustStats(null, ticket, ticket), null);
    assert.equal(adjustStats({ ...stats, open: 0 }, ticket, { ...ticket, status: "CLOSED" }).open, 0, "never negative");
});

test("provisional events: one per really changed audited field, marked pending", () => {
    const now = new Date("2026-11-24T10:00:00Z");
    const users = [{ id: 9, name: "Ann" }];

    const events = buildProvisionalEvents(
        ticket,
        { status: "RESOLVED", priority: "MEDIUM", assigneeId: 9, isReviewed: true },
        "me@example.com",
        users,
        now
    );

    assert.deepEqual(events.map((e) => [e.field, e.oldValue, e.newValue]), [
        ["status", "OPEN", "RESOLVED"],
        ["assigneeId", null, "9"],
    ]);
    assert.ok(events.every((e) => e.pending && e.actor === "me@example.com" && e.createdAt === now.toISOString()));
    assert.equal(events[1].oldLabel, "Unassigned");
    assert.equal(events[1].newLabel, "Ann");
    assert.equal(new Set(events.map((e) => e.id)).size, 2, "ids are unique");
});

test("diffPatch drops values that equal the current ticket", () => {
    assert.deepEqual(diffPatch(ticket, { status: "OPEN", priority: "HIGH", assigneeId: null }), { priority: "HIGH" });
    assert.deepEqual(diffPatch(ticket, { isReviewed: false }), {});
});
