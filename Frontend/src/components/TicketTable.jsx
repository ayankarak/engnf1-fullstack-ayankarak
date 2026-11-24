import { Link } from "react-router-dom";

import Badge from "./Badge.jsx";
import { TableSkeleton } from "./Skeleton.jsx";
import { EmptyState, ErrorState } from "./States.jsx";
import { STATUSES, humanize } from "../utils/constants.js";
import { timeAgo } from "../utils/format.js";

function StatusControl({ ticket, canEdit, pending, onChange }) {
    if (!canEdit) return <Badge kind="status" value={ticket.status} />;

    return (
        <select
            value={ticket.status}
            disabled={pending}
            onChange={(event) => onChange(ticket.id, { status: event.target.value })}
            aria-label={`Status of ticket ${ticket.id}`}
            className={`rounded-md border-0 py-1 pl-2 pr-7 text-xs font-medium ring-1 ring-slate-300 focus:ring-2 focus:ring-indigo-500 ${
                pending ? "animate-pulse opacity-60" : ""
            }`}
        >
            {STATUSES.map((status) => (
                <option key={status} value={status}>
                    {humanize(status)}
                </option>
            ))}
        </select>
    );
}

function SubjectLink({ ticket }) {
    return (
        <Link
            to={`/tickets/${ticket.id}`}
            className="font-medium text-slate-900 transition hover:text-indigo-600 focus:outline-none focus-visible:underline"
        >
            {ticket.subject}
        </Link>
    );
}

export default function TicketTable({ tickets, loading, error, onRetry, canEdit, pendingIds, onChange, hasFilters, onClearFilters }) {
    if (loading && tickets.length === 0) return <TableSkeleton />;
    if (error && tickets.length === 0) return <ErrorState title="Could not load tickets" error={error} onRetry={onRetry} />;

    if (tickets.length === 0) {
        return hasFilters ? (
            <EmptyState
                title="No tickets match your filters"
                message="Try a different search term or clear the filters."
                action={
                    <button type="button" onClick={onClearFilters} className="text-sm font-medium text-indigo-600 hover:underline">
                        Clear filters
                    </button>
                }
            />
        ) : (
            <EmptyState
                title="No tickets yet"
                message="Imported and manually created tickets will show up here, already classified."
            />
        );
    }

    return (
        <div className={`transition-opacity ${loading ? "opacity-60" : "opacity-100"}`} aria-busy={loading}>
            {/* Desktop / tablet */}
            <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <tr>
                            <th scope="col" className="px-4 py-3">Ticket</th>
                            <th scope="col" className="px-4 py-3">Subject</th>
                            <th scope="col" className="px-4 py-3">Category</th>
                            <th scope="col" className="px-4 py-3">Priority</th>
                            <th scope="col" className="px-4 py-3">Status</th>
                            <th scope="col" className="px-4 py-3">Assignee</th>
                            <th scope="col" className="px-4 py-3">Updated</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {tickets.map((ticket) => (
                            <tr key={ticket.id} className="transition hover:bg-slate-50/70">
                                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                                    <div className="font-medium text-slate-700">#{ticket.id}</div>
                                    <div className="max-w-[9rem] truncate text-xs" title={ticket.externalId}>{ticket.externalId}</div>
                                </td>
                                <td className="max-w-xs px-4 py-3">
                                    <SubjectLink ticket={ticket} />
                                    <p className="mt-0.5 truncate text-xs text-slate-500">{ticket.body}</p>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5">
                                        <Badge kind="category" value={ticket.category} />
                                        {ticket.isHumanOverride && (
                                            <span className="text-xs text-slate-400" title="Category set manually by an agent">
                                                edited
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3"><Badge kind="priority" value={ticket.priority} /></td>
                                <td className="px-4 py-3">
                                    <StatusControl ticket={ticket} canEdit={canEdit} pending={pendingIds.has(ticket.id)} onChange={onChange} />
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                    {ticket.assignee?.name || <span className="text-slate-400">Unassigned</span>}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{timeAgo(ticket.updatedAt)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile */}
            <ul className="divide-y divide-slate-100 md:hidden">
                {tickets.map((ticket) => (
                    <li key={ticket.id} className="space-y-2 px-4 py-4">
                        <div className="flex items-start justify-between gap-2">
                            <SubjectLink ticket={ticket} />
                            <span className="text-xs text-slate-400">#{ticket.id}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                            <Badge kind="category" value={ticket.category} />
                            <Badge kind="priority" value={ticket.priority} />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <StatusControl ticket={ticket} canEdit={canEdit} pending={pendingIds.has(ticket.id)} onChange={onChange} />
                            <span className="text-xs text-slate-500">{timeAgo(ticket.updatedAt)}</span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
