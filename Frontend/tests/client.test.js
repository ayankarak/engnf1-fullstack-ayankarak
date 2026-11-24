import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";

import { ApiError, buildQuery, request, setUnauthorizedHandler, tokenStore } from "../src/api/client.js";

const storage = new Map();
globalThis.localStorage = {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
};

const respond = (status, body) => async () =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
    storage.clear();
    setUnauthorizedHandler(null);
});

test("buildQuery skips empty values", () => {
    assert.equal(buildQuery({ q: "crash", status: "", page: 2, x: undefined, y: null }), "?q=crash&page=2");
    assert.equal(buildQuery({}), "");
    assert.equal(buildQuery({ q: "100% & more" }), "?q=100%25+%26+more");
});

test("request sends the bearer token and unwraps data", async () => {
    tokenStore.set("abc");
    let seen;
    globalThis.fetch = async (url, options) => {
        seen = { url, options };
        return respond(200, { success: true, data: { ok: 1 } })();
    };

    assert.deepEqual(await request("/tickets"), { ok: 1 });
    assert.equal(seen.url, "/api/tickets");
    assert.equal(seen.options.headers.Authorization, "Bearer abc");
});

test("request sends JSON bodies and no token when auth is false", async () => {
    tokenStore.set("abc");
    let seen;
    globalThis.fetch = async (url, options) => {
        seen = options;
        return respond(200, { data: null })();
    };

    await request("/auth/login", { method: "POST", body: { a: 1 }, auth: false });
    assert.equal(seen.headers.Authorization, undefined);
    assert.equal(seen.headers["Content-Type"], "application/json");
    assert.equal(seen.body, '{"a":1}');
});

test("API errors become ApiError with status and the server's message", async () => {
    globalThis.fetch = respond(409, { success: false, message: "Email already registered" });

    await assert.rejects(
        () => request("/auth/register", { method: "POST", body: {}, auth: false }),
        (error) => error instanceof ApiError && error.status === 409 && error.message === "Email already registered"
    );
});

test("validation errors are joined into a readable message", async () => {
    globalThis.fetch = respond(400, {
        message: "Validation failed",
        errors: [{ message: "Subject is required" }, { message: "Description is required" }],
    });

    await assert.rejects(() => request("/tickets"), { message: "Subject is required. Description is required" });
});

test("401 with a stored token signs the user out; a failed login attempt does not", async () => {
    let calls = 0;
    setUnauthorizedHandler(() => { calls += 1; });
    globalThis.fetch = respond(401, { message: "Token has expired" });

    tokenStore.set("old");
    await assert.rejects(() => request("/tickets"));
    assert.equal(calls, 1);

    storage.clear();
    globalThis.fetch = respond(401, { message: "Invalid email or password" });
    await assert.rejects(() => request("/auth/login", { method: "POST", body: {}, auth: false }));
    assert.equal(calls, 1);
});

test("network failures give a friendly message; aborts pass through", async () => {
    globalThis.fetch = async () => { throw new TypeError("fetch failed"); };
    await assert.rejects(() => request("/tickets"), (e) => e instanceof ApiError && e.status === 0 && /Cannot reach the server/.test(e.message));

    globalThis.fetch = async () => { throw new DOMException("aborted", "AbortError"); };
    await assert.rejects(() => request("/tickets"), { name: "AbortError" });
});

test("non-JSON error bodies still produce an error", async () => {
    globalThis.fetch = async () => new Response("Bad gateway", { status: 502 });
    await assert.rejects(() => request("/tickets"), { message: "Request failed (502)" });
});
