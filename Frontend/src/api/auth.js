import { request } from "./client.js";

export const login = (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password }, auth: false });

export const register = (name, email, password) =>
    request("/auth/register", { method: "POST", body: { name, email, password }, auth: false });

export const getMe = (signal) => request("/auth/me", { signal });
