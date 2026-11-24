import { request, buildQuery } from "./client.js";

export const listTickets = (params, signal) => request(`/tickets${buildQuery(params)}`, { signal });

export const getTicketStats = (signal) => request("/tickets/stats", { signal });

export const getTicket = (id, signal) => request(`/tickets/${id}`, { signal });

export const createTicket = (payload) => request("/tickets", { method: "POST", body: payload });

export const updateTicket = (id, patch) => request(`/tickets/${id}`, { method: "PATCH", body: patch });

export const deleteTicket = (id) => request(`/tickets/${id}`, { method: "DELETE" });

export const listAssignableUsers = (signal) => request("/users/assignable", { signal });
