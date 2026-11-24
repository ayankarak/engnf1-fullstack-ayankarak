// Single source of truth for enum values shared by models, validators and services.

const ROLES = Object.freeze({
    USER: "USER", // read-only access to tickets
    AGENT: "AGENT", // can triage: create/import/update tickets
    ADMIN: "ADMIN", // everything an agent can do + delete tickets + manage roles
});

const ROLE_VALUES = Object.values(ROLES);

const TICKET_CATEGORIES = ["BILLING", "BUG", "FEATURE_REQUEST", "LOGIN", "DELIVERY"];
const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

// Ticket fields whose changes are written to the audit trail (ticket_events.field).
const AUDITED_FIELDS = ["category", "priority", "status", "assigneeId"];

// Actor recorded when the system (not a person) changes a ticket, e.g. a re-import.
const SYSTEM_IMPORT_ACTOR = "system:import";

export default {
    ROLES,
    ROLE_VALUES,
    TICKET_CATEGORIES,
    TICKET_PRIORITIES,
    TICKET_STATUSES,
    AUDITED_FIELDS,
    SYSTEM_IMPORT_ACTOR,
};
