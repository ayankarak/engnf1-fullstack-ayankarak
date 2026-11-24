import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import CreateTicketDialog from "../components/CreateTicketDialog.jsx";
import Pagination from "../components/Pagination.jsx";
import StatCard from "../components/StatCard.jsx";
import TicketFilters from "../components/TicketFilters.jsx";
import TicketTable from "../components/TicketTable.jsx";
import { ErrorState } from "../components/States.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useAssignees } from "../hooks/useAssignees.js";
import { useTicketList } from "../hooks/useTicketList.js";
import { CATEGORIES, DEFAULT_PAGE_SIZE, PAGE_SIZES, PRIORITIES, STATUSES } from "../utils/constants.js";

const pick = (value, allowed) => (allowed.includes(value) ? value : "");

export default function DashboardPage() {
    const { canTriage } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [creating, setCreating] = useState(false);

    // Filters live in the URL, so they survive reloads and can be shared.
    const filters = {
        status: pick(searchParams.get("status"), STATUSES),
        category: pick(searchParams.get("category"), CATEGORIES),
        priority: pick(searchParams.get("priority"), PRIORITIES),
        q: searchParams.get("q") || "",
    };
    const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
    const requestedLimit = parseInt(searchParams.get("limit"), 10);
    const limit = PAGE_SIZES.includes(requestedLimit) ? requestedLimit : DEFAULT_PAGE_SIZE;

    const params = useMemo(
        () => ({ ...filters, page, limit }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [filters.status, filters.category, filters.priority, filters.q, page, limit]
    );

    const assignees = useAssignees(canTriage);
    const { tickets, pagination, loading, error, stats, pendingIds, updateTicket, reload } = useTicketList(params, assignees);

    const updateParams = (changes, { keepPage = false } = {}) => {
        const next = new URLSearchParams(searchParams);

        for (const [key, value] of Object.entries(changes)) {
            if (value === "" || value === null || value === undefined) next.delete(key);
            else next.set(key, String(value));
        }
        if (!keepPage) next.delete("page");

        setSearchParams(next);
    };

    // Debounced search box.
    const [searchText, setSearchText] = useState(filters.q);
    useEffect(() => setSearchText(filters.q), [filters.q]);
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchText.trim() !== filters.q) updateParams({ q: searchText.trim() });
        }, 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchText]);

    // If the current page no longer exists (e.g. after filtering), jump to the last one.
    useEffect(() => {
        if (pagination && pagination.totalPages > 0 && page > pagination.totalPages) {
            updateParams({ page: pagination.totalPages }, { keepPage: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination, page]);

    const hasFilters = Boolean(filters.status || filters.category || filters.priority || filters.q);
    const clearFilters = () => {
        setSearchText("");
        setSearchParams(new URLSearchParams());
    };

    const toggle = (key, value) => updateParams({ [key]: filters[key] === value ? "" : value });
    const data = stats.data;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Tickets</h1>
                    <p className="text-sm text-slate-500">Review, classify and assign incoming support tickets.</p>
                </div>
                {canTriage && (
                    <button
                        type="button"
                        onClick={() => setCreating(true)}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    >
                        New ticket
                    </button>
                )}
            </div>

            {stats.error && !data ? (
                <div className="rounded-xl border border-slate-200 bg-white">
                    <ErrorState title="Could not load statistics" error={stats.error} onRetry={reload} />
                </div>
            ) : (
                <section aria-label="Ticket statistics" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                    <StatCard label="Total" value={data?.total} loading={stats.loading && !data} active={!filters.status && !filters.priority} onClick={() => updateParams({ status: "", priority: "" })} />
                    <StatCard label="Open" value={data?.open} accent="indigo" loading={stats.loading && !data} active={filters.status === "OPEN"} onClick={() => toggle("status", "OPEN")} />
                    <StatCard label="In progress" value={data?.inProgress} accent="amber" loading={stats.loading && !data} active={filters.status === "IN_PROGRESS"} onClick={() => toggle("status", "IN_PROGRESS")} />
                    <StatCard label="Resolved" value={data?.resolved} accent="emerald" loading={stats.loading && !data} active={filters.status === "RESOLVED"} onClick={() => toggle("status", "RESOLVED")} />
                    <StatCard label="Urgent" value={data?.urgent} accent="red" loading={stats.loading && !data} active={filters.priority === "URGENT"} onClick={() => toggle("priority", "URGENT")} />
                </section>
            )}

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <TicketFilters
                    searchText={searchText}
                    onSearchChange={setSearchText}
                    filters={filters}
                    onFilterChange={(key, value) => updateParams({ [key]: value })}
                    onClear={clearFilters}
                    hasFilters={hasFilters}
                />

                <TicketTable
                    tickets={tickets}
                    loading={loading}
                    error={error}
                    onRetry={reload}
                    canEdit={canTriage}
                    pendingIds={pendingIds}
                    onChange={updateTicket}
                    hasFilters={hasFilters}
                    onClearFilters={clearFilters}
                />

                <Pagination
                    pagination={pagination}
                    onPageChange={(next) => updateParams({ page: next }, { keepPage: true })}
                    onLimitChange={(next) => updateParams({ limit: next })}
                />
            </section>

            {creating && (
                <CreateTicketDialog
                    onClose={() => setCreating(false)}
                    onCreated={(ticket) => {
                        setCreating(false);
                        navigate(`/tickets/${ticket.id}`);
                    }}
                />
            )}
        </div>
    );
}
