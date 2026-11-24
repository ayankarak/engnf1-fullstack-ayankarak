import { useCallback, useEffect, useRef, useState } from "react";

import { getTicketStats, listTickets, updateTicket as updateTicketRequest } from "../api/tickets.js";
import { useToast } from "../context/ToastContext.jsx";
import { adjustStats, applyTicketPatch, createPendingGuard, runOptimistic } from "../utils/optimistic.js";

const withoutEvents = (ticket) => {
    const { events, ...rest } = ticket; // eslint-disable-line no-unused-vars
    return rest;
};

/**
 * Ticket list + dashboard counters for the given filters.
 * updateTicket() is optimistic: the row/counters change immediately and are rolled
 * back (with a toast) if the API call fails.
 */
export function useTicketList(params, assignees) {
    const toast = useToast();

    const [list, setList] = useState({ tickets: [], pagination: null, loading: true, error: null });
    const [stats, setStats] = useState({ data: null, loading: true, error: null });
    const [pendingIds, setPendingIds] = useState(() => new Set());
    const [reloadKey, setReloadKey] = useState(0);

    const guard = useRef(createPendingGuard());
    const latest = useRef({});
    latest.current = { list, stats, assignees, params };

    const paramsKey = JSON.stringify(params);

    useEffect(() => {
        const controller = new AbortController();
        setList((current) => ({ ...current, loading: true, error: null }));

        listTickets(latest.current.params, controller.signal)
            .then((data) => setList({ tickets: data.tickets, pagination: data.pagination, loading: false, error: null }))
            .catch((error) => {
                if (error.name === "AbortError") return;
                setList((current) => ({ ...current, loading: false, error }));
            });

        return () => controller.abort();
    }, [paramsKey, reloadKey]);

    const loadStats = useCallback(async (signal) => {
        try {
            const data = await getTicketStats(signal);
            setStats({ data: data.stats, loading: false, error: null });
        } catch (error) {
            if (error.name === "AbortError") return;
            setStats((current) => ({ ...current, loading: false, error }));
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        loadStats(controller.signal);
        return () => controller.abort();
    }, [loadStats, reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    const updateTicket = useCallback(
        async (id, patch) => {
            const before = latest.current.list.tickets.find((ticket) => ticket.id === id);
            if (!before) return false;

            // One in-flight request per ticket keeps the UI and the server in step.
            if (!guard.current.tryStart(id)) return false;
            setPendingIds(guard.current.keys());

            const { ok, error } = await runOptimistic({
                apply: () => {
                    const after = applyTicketPatch(before, patch, latest.current.assignees);
                    const previousStats = latest.current.stats.data;

                    setList((current) => ({
                        ...current,
                        tickets: current.tickets.map((ticket) => (ticket.id === id ? after : ticket)),
                    }));
                    setStats((current) => ({ ...current, data: adjustStats(current.data, before, after) }));

                    return { previousStats };
                },
                request: () => updateTicketRequest(id, patch),
                commit: (data) => {
                    setList((current) => ({
                        ...current,
                        tickets: current.tickets.map((ticket) => (ticket.id === id ? withoutEvents(data.ticket) : ticket)),
                    }));
                },
                rollback: ({ previousStats }) => {
                    setList((current) => ({
                        ...current,
                        tickets: current.tickets.map((ticket) => (ticket.id === id ? before : ticket)),
                    }));
                    setStats((current) => ({ ...current, data: previousStats }));
                },
            });

            guard.current.finish(id);
            setPendingIds(guard.current.keys());

            if (ok) {
                loadStats(); // reconcile the counters with the server
            } else {
                toast.error(`Could not update ticket #${id}: ${error.message}. Your change was reverted.`);
            }

            return ok;
        },
        [loadStats, toast]
    );

    return { ...list, stats, pendingIds, updateTicket, reload };
}
