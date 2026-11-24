const BASE_URL = (import.meta.env?.VITE_API_URL || "/api").replace(/\/+$/, "");
const TOKEN_KEY = "triagesync_token";

// The token lives in localStorage so a page reload keeps you signed in.
export const tokenStore = {
    get() {
        try {
            return localStorage.getItem(TOKEN_KEY);
        } catch {
            return null;
        }
    },
    set(token) {
        try {
            localStorage.setItem(TOKEN_KEY, token);
        } catch {
            // storage unavailable (private mode): the session just won't survive a reload
        }
    },
    clear() {
        try {
            localStorage.removeItem(TOKEN_KEY);
        } catch {
            // ignore
        }
    },
};

export class ApiError extends Error {
    constructor(message, { status = 0, errors = [] } = {}) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.errors = errors;
    }
}

let unauthorizedHandler = null;
export const setUnauthorizedHandler = (handler) => {
    unauthorizedHandler = handler;
};

const messageFrom = (payload, status) => {
    if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
        return payload.errors.map((error) => error.message).filter(Boolean).join(". ");
    }
    return payload?.message || `Request failed (${status})`;
};

export async function request(path, { method = "GET", body, signal, auth = true } = {}) {
    const token = auth ? tokenStore.get() : null;

    let response;
    try {
        response = await fetch(`${BASE_URL}${path}`, {
            method,
            signal,
            headers: {
                Accept: "application/json",
                ...(body !== undefined && { "Content-Type": "application/json" }),
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch (error) {
        if (error?.name === "AbortError") throw error;
        throw new ApiError("Cannot reach the server. Check your connection and try again.", { status: 0 });
    }

    let payload = null;
    try {
        payload = await response.json();
    } catch {
        // empty or non-JSON body
    }

    if (!response.ok) {
        // An expired/invalid session: sign the user out (but not for a failed login attempt).
        if (response.status === 401 && token) unauthorizedHandler?.();

        throw new ApiError(messageFrom(payload, response.status), {
            status: response.status,
            errors: payload?.errors || [],
        });
    }

    return payload?.data ?? null;
}

export const buildQuery = (params = {}) => {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === "") continue;
        search.set(key, String(value));
    }

    const text = search.toString();
    return text ? `?${text}` : "";
};
