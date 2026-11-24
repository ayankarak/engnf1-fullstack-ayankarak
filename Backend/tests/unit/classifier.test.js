import "../support/set-env.js";
import ticketClassifier from "../../src/utils/ticket-classifier.js";
import assert from "node:assert/strict";
import test from "node:test";

const { classifyTicket } = ticketClassifier;

const classify = (subject, body = "") => {
    const { category, priority } = classifyTicket({ subject, body });
    return { category, priority };
};

test("spec example: package not arrived -> DELIVERY / HIGH", () => {
    assert.deepEqual(
        classifyTicket({ subject: "Package not arrived", body: "My package has not arrived." }),
        { autoCategory: "DELIVERY", category: "DELIVERY", priority: "HIGH" }
    );
});

test("payment refund -> BILLING / HIGH", () => {
    assert.deepEqual(classify("Payment refund", "Please refund my payment"), {
        category: "BILLING",
        priority: "HIGH",
    });
});

test("login locked out -> LOGIN / URGENT", () => {
    assert.deepEqual(classify("Login locked out", "I am locked out of my account"), {
        category: "LOGIN",
        priority: "URGENT",
    });
});

test("application error crash -> BUG / HIGH (priority comes from the word 'error')", () => {
    assert.deepEqual(classify("Application crash", "The app throws an error on start"), {
        category: "BUG",
        priority: "HIGH",
    });
});

test("application crash without the word 'error' -> BUG / MEDIUM (documented rule table)", () => {
    assert.deepEqual(classify("Application crash"), { category: "BUG", priority: "MEDIUM" });
});

test("general suggestion -> FEATURE_REQUEST / MEDIUM", () => {
    assert.deepEqual(classify("Idea", "Please add dark mode"), {
        category: "FEATURE_REQUEST",
        priority: "MEDIUM",
    });
});

test("subject and body are both considered", () => {
    assert.equal(classify("Hello", "my invoice is wrong").category, "BILLING");
    assert.equal(classify("my invoice is wrong", "Hello").category, "BILLING");
});

test("matching is case-insensitive", () => {
    assert.deepEqual(classify("URGENT", "PRODUCTION DOWN"), {
        category: "FEATURE_REQUEST",
        priority: "URGENT",
    });
});

test("no accidental partial-word matches", () => {
    assert.equal(classify("Discharge", "a discharge of energy").category, "FEATURE_REQUEST");
    assert.equal(classify("Better packaging", "for gift orders").category, "FEATURE_REQUEST");
    assert.equal(classify("Terror", "of the night").priority, "MEDIUM");
    assert.equal(classify("Order 15000", "units").category, "FEATURE_REQUEST");
});

test("simple inflections still match", () => {
    assert.equal(classify("I was charged twice").category, "BILLING");
    assert.equal(classify("App keeps crashing").category, "BUG");
    assert.equal(classify("Several errors", "").priority, "HIGH");
    assert.equal(classify("Packages missing").category, "DELIVERY");
});

test("multi-word keywords tolerate extra whitespace", () => {
    assert.equal(classify("production    down").priority, "URGENT");
    assert.equal(classify("locked\nout").priority, "URGENT");
});

test("precedence is deterministic: BILLING > LOGIN > DELIVERY > BUG", () => {
    assert.equal(classify("refund", "login error package crash").category, "BILLING");
    assert.equal(classify("login", "package crash").category, "LOGIN");
    assert.equal(classify("package", "crash").category, "DELIVERY");
    assert.equal(classify("crash").category, "BUG");
});

test("precedence for priority: URGENT > HIGH", () => {
    assert.equal(classify("refund", "this is urgent").priority, "URGENT");
});

test("identical input always yields identical output", () => {
    const input = { subject: "Refund and login error", body: "urgent" };
    const first = classifyTicket(input);
    for (let i = 0; i < 50; i += 1) assert.deepEqual(classifyTicket(input), first);
});

test("missing fields do not throw", () => {
    assert.deepEqual(classifyTicket(), {
        autoCategory: "FEATURE_REQUEST",
        category: "FEATURE_REQUEST",
        priority: "MEDIUM",
    });
});
