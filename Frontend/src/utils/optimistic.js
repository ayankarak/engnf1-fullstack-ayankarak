// Framework-free building blocks for optimistic updates (unit-tested in tests/).
import { AUDITED_FIELDS } from "./constants.js";

const STATUS_KEYS = {
    OPEN: "open",
    IN_PROGRESS: "inProgress",
    RESOLVED: "resolved",
    CLOSED: "closed",
};

/**
 * Applies one optimistic mutation:
 *  1. apply()    - update the UI immediately, returns whatever rollback needs
 *  2. request()  - the API call, in the background
 *  3. commit()   - on success keep the UI (usually replaced with the server's version)
 *  4. rollback() - on failure restore the previous state
 * Never throws; resolves to { ok, result | error }.
 */
export async function runOptimistic({ apply, request, commit, rollback }) {
    const snapshot = apply();

    try {
        const result = await request();
        commit?.(result, snapshot);
        return { ok: true, result };
    } catch (error) {
        rollback?.(snapshot, error);
        return { ok: false, error };
    }
}

// Prevents duplicate in-flight requests for the same key (e.g. one per ticket).
export function createPendingGuard() {
    const keys = new Set();

    return {
        tryStart(key) {
            if (keys.has(key)) return false;
            keys.add(key);
            return true;
        },
        finish(key) {
            keys.delete(key);
        },
        has: (key) => keys.has(key),
        keys: () => new Set(keys),
    };
}

export function applyTicketPatch(ticket, patch, assignees = []) {
    const next = { ...ticket, ...patch };

    // The server marks a real category change as a human override; mirror that.
    if (patch.category !== undefined && patch.category !== ticket.category) {
        next.isHumanOverride = true;
    }

    if ("assigneeId" in patch) {
        if (patch.assigneeId === null || patch.assigneeId === undefined) {
            next.assigneeId = null;
            next.assignee = null;
        } else {
            const user = assignees.find((candidate) => candidate.id === patch.assigneeId);
            next.assignee = user
                ? { id: user.id, name: user.name, email: user.email }
                : { id: patch.assigneeId, name: `User #${patch.assigneeId}`, email: "" };
        }
    }

    return next;
}

// Moves the ticket between the dashboard counters.
export function adjustStats(stats, before, after) {
    if (!stats) return stats;

    const next = { ...stats };

    if (before.status !== after.status) {
        const from = STATUS_KEYS[before.status];
        const to = STATUS_KEYS[after.status];
        if (from) next[from] = Math.max(0, next[from] - 1);
        if (to) next[to] += 1;
    }

    if (before.priority !== after.priority) {
        if (before.priority === "URGENT") next.urgent = Math.max(0, next.urgent - 1);
        if (after.priority === "URGENT") next.urgent += 1;
    }

    return next;
}

// Provisional timeline entries shown until the server confirms the change.
export function buildProvisionalEvents(ticket, patch, actor, assignees = [], now = new Date()) {
    const nameOf = (id) => {
        if (id === null || id === undefined) return "Unassigned";
        return assignees.find((user) => user.id === id)?.name || `User #${id}`;
    };

    return AUDITED_FIELDS.filter((field) => patch[field] !== undefined && patch[field] !== ticket[field]).map(
        (field) => {
            const oldValue = ticket[field] ?? null;
            const newValue = patch[field] ?? null;

            return {
                id: `pending-${field}-${now.getTime()}`,
                ticketId: ticket.id,
                field,
                oldValue: oldValue === null ? null : String(oldValue),
                newValue: newValue === null ? null : String(newValue),
                oldLabel: field === "assigneeId" ? nameOf(oldValue) : null,
                newLabel: field === "assigneeId" ? nameOf(newValue) : null,
                actor,
                createdAt: now.toISOString(),
                pending: true,
            };
        }
    );
}

// Only the fields that really differ from the current ticket.
export function diffPatch(ticket, patch) {
    return Object.fromEntries(
        Object.entries(patch).filter(([field, value]) => (ticket[field] ?? null) !== (value ?? null))
    );
}
