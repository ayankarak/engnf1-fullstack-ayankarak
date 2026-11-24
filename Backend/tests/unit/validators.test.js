import "../support/set-env.js";
import escapeLikeUtils from "../../src/utils/escape-like.js";
import userValidator from "../../src/validators/user.validator.js";
import authValidator from "../../src/validators/auth.validator.js";
import ticketValidator from "../../src/validators/ticket.validator.js";
import assert from "node:assert/strict";
import test from "node:test";

const {
    createTicketSchema,
    importTicketSchema,
    updateTicketSchema,
    ticketQuerySchema,
    ticketIdSchema,
} = ticketValidator;
const { registerSchema, loginSchema } = authValidator;
const { updateUserRoleSchema } = userValidator;
const { escapeLike } = escapeLikeUtils;

test("ticket query: defaults and coercion", () => {
    const parsed = ticketQuerySchema.parse({});
    assert.equal(parsed.page, 1);
    assert.equal(parsed.limit, 10);
    assert.equal(parsed.sortBy, "createdAt");
    assert.equal(parsed.sortOrder, "desc");
    assert.equal(parsed.q, undefined);
    assert.equal(parsed.assigneeId, undefined);

    const coerced = ticketQuerySchema.parse({ page: "3", limit: "25", assigneeId: "7", q: "  crash " });
    assert.equal(coerced.page, 3);
    assert.equal(coerced.limit, 25);
    assert.equal(coerced.assigneeId, 7);
    assert.equal(coerced.q, "crash");
});

test("ticket query: empty q is ignored, invalid values rejected", () => {
    assert.equal(ticketQuerySchema.parse({ q: "   " }).q, undefined);
    assert.equal(ticketQuerySchema.safeParse({ limit: "101" }).success, false);
    assert.equal(ticketQuerySchema.safeParse({ page: "0" }).success, false);
    assert.equal(ticketQuerySchema.safeParse({ status: "DONE" }).success, false);
    assert.equal(ticketQuerySchema.safeParse({ category: "bug" }).success, false);
    assert.equal(ticketQuerySchema.safeParse({ status: ["OPEN", "CLOSED"] }).success, false);
    assert.equal(ticketQuerySchema.safeParse({ q: "x".repeat(101) }).success, false);
});

test("create/import: category and priority cannot be supplied by clients", () => {
    const parsed = createTicketSchema.parse({
        subject: "Hi",
        body: "Body",
        category: "BUG",
        priority: "URGENT",
    });
    assert.deepEqual(parsed, { subject: "Hi", body: "Body" });

    const imported = importTicketSchema.parse({
        externalId: " TICKET-101 ",
        subject: "Payment failed",
        body: "Money deducted but order not confirmed",
        category: "BUG",
    });
    assert.equal(imported.externalId, "TICKET-101");
    assert.equal("category" in imported, false);
});

test("import requires externalId, create does not", () => {
    assert.equal(importTicketSchema.safeParse({ subject: "a", body: "b" }).success, false);
    assert.equal(createTicketSchema.safeParse({ subject: "a", body: "b" }).success, true);
    assert.equal(importTicketSchema.safeParse({ externalId: "  ", subject: "a", body: "b" }).success, false);
});

test("update: needs at least one known field and valid enums", () => {
    assert.equal(updateTicketSchema.safeParse({}).success, false);
    assert.equal(updateTicketSchema.safeParse({ subject: "nope" }).success, false);
    assert.equal(updateTicketSchema.safeParse({ status: "RESOLVED" }).success, true);
    assert.equal(updateTicketSchema.safeParse({ status: "DONE" }).success, false);
    assert.equal(updateTicketSchema.safeParse({ assigneeId: null }).success, true);
    assert.equal(updateTicketSchema.safeParse({ assigneeId: "5" }).success, false);
    assert.equal(updateTicketSchema.safeParse({ isReviewed: true }).success, true);
});

test("ticket id param", () => {
    assert.equal(ticketIdSchema.parse({ id: "12" }).id, 12);
    assert.equal(ticketIdSchema.safeParse({ id: "abc" }).success, false);
    assert.equal(ticketIdSchema.safeParse({ id: "-1" }).success, false);
});

test("register: role can never be chosen by the client", () => {
    const parsed = registerSchema.parse({
        name: "Eve",
        email: " EVE@Example.COM ",
        password: "password123",
        role: "ADMIN",
    });
    assert.equal(parsed.role, undefined);
    assert.equal(parsed.email, "eve@example.com");
});

test("register/login validation", () => {
    assert.equal(registerSchema.safeParse({ name: "E", email: "e@x.com", password: "password123" }).success, false);
    assert.equal(registerSchema.safeParse({ name: "Eve", email: "nope", password: "password123" }).success, false);
    assert.equal(registerSchema.safeParse({ name: "Eve", email: "e@x.com", password: "short" }).success, false);
    assert.equal(loginSchema.safeParse({ email: "e@x.com", password: "" }).success, false);
});

test("role update only accepts known roles", () => {
    assert.equal(updateUserRoleSchema.safeParse({ role: "AGENT" }).success, true);
    assert.equal(updateUserRoleSchema.safeParse({ role: "ROOT" }).success, false);
});

test("escapeLike escapes %, _ and backslash", () => {
    assert.equal(escapeLike("100%"), "100\\%");
    assert.equal(escapeLike("a_b"), "a\\_b");
    assert.equal(escapeLike("a\\b"), "a\\\\b");
    assert.equal(escapeLike("plain"), "plain");
    assert.equal(escapeLike("'; DROP TABLE tickets;--"), "'; DROP TABLE tickets;--");
});
