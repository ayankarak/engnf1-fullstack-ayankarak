import { useCallback, useEffect, useRef, useState } from "react";

import { getTicket, updateTicket as updateTicketRequest } from "../api/tickets.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import {
    applyTicketPatch,
    buildProvisionalEvents,
    createPendingGuard,
    diffPatch,
    runOptimistic,
} from "../utils/optimistic.js";

/**
 * One ticket with its audit history. updateTicket() is optimistic: the ticket and a
 * provisional timeline entry appear immediately; on failure both are rolled back.
 */
export function useTicketDetail(id, assignees) {
    const toast = useToast();
    const { user } = useAuth();

    const [state, setState] = useState({ ticket: null, loading: true, error: null });
    const [saving, setSaving] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const guard = useRef(createPendingGuard());
    const latest = useRef({});
    latest.current = { state, assignees, user };

    useEffect(() => {
        const controller = new AbortController();
        setState((current) => ({ ...current, loading: true, error: null }));

        getTicket(id, controller.signal)
            .then((data) => setState({ ticket: data.ticket, loading: false, error: null }))
            .catch((error) => {
                if (error.name === "AbortError") return;
                setState({ ticket: null, loading: false, error });
            });

        return () => controller.abort();
    }, [id, reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    const updateTicket = useCallback(
        async (rawPatch) => {
            const before = latest.current.state.ticket;
            if (!before) return false;

            const patch = diffPatch(before, rawPatch);
            if (Object.keys(patch).length === 0) return true; // nothing changed, nothing to send

            if (!guard.current.tryStart(before.id)) return false;
            setSaving(true);

            const { ok, error } = await runOptimistic({
                apply: () => {
                    const after = applyTicketPatch(before, patch, latest.current.assignees);
                    const provisional = buildProvisionalEvents(
                        before,
                        patch,
                        latest.current.user?.email || "you",
                        latest.current.assignees
                    );

                    setState((current) => ({
                        ...current,
                        ticket: { ...after, events: [...(before.events || []), ...provisional] },
                    }));
                },
                request: () => updateTicketRequest(before.id, patch),
                // The server's ticket and event list replace the provisional ones.
                commit: (data) => setState({ ticket: data.ticket, loading: false, error: null }),
                rollback: () => setState((current) => ({ ...current, ticket: before })),
            });

            guard.current.finish(before.id);
            setSaving(false);

            if (ok) {
                toast.success("Ticket updated");
            } else {
                toast.error(`Update failed: ${error.message}. Your change was reverted.`);
            }

            return ok;
        },
        [toast]
    );

    return { ...state, saving, updateTicket, reload };
}
