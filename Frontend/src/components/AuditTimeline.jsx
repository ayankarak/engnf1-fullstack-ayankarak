import Badge from "./Badge.jsx";
import { FIELD_LABELS, humanize } from "../utils/constants.js";
import { formatDateTime } from "../utils/format.js";

const ENUM_KIND = { category: "category", priority: "priority", status: "status" };

function Value({ field, value, label }) {
    if (field === "assigneeId") {
        return <span className="font-medium text-slate-800">{label || (value === null ? "Unassigned" : `User #${value}`)}</span>;
    }

    if (value === null || value === undefined) return <span className="text-slate-400">none</span>;

    const kind = ENUM_KIND[field];
    return kind ? <Badge kind={kind} value={value} /> : <span>{humanize(value)}</span>;
}

// Read-only, oldest first. Entries marked `pending` are optimistic and not yet confirmed.
export default function AuditTimeline({ events }) {
    if (!events || events.length === 0) {
        return (
            <p className="py-6 text-center text-sm text-slate-500">
                No changes yet. Edits to category, priority, status or assignee will be recorded here.
            </p>
        );
    }

    return (
        <ol className="relative ml-2 border-l border-slate-200" aria-label="Audit history">
            {events.map((event) => (
                <li key={event.id} className={`animate-fade-in mb-5 ml-5 last:mb-0 ${event.pending ? "opacity-60" : ""}`}>
                    <span
                        className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white ${
                            event.pending ? "bg-slate-300" : "bg-indigo-500"
                        }`}
                        aria-hidden="true"
                    />
                    <p className="text-sm font-medium text-slate-900">
                        {FIELD_LABELS[event.field] || event.field} changed
                        {event.pending && <span className="ml-2 text-xs font-normal text-slate-500">Saving...</span>}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        <Value field={event.field} value={event.oldValue} label={event.oldLabel} />
                        <span aria-hidden="true" className="text-slate-400">&rarr;</span>
                        <span className="sr-only">changed to</span>
                        <Value field={event.field} value={event.newValue} label={event.newLabel} />
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        by <span className="font-medium text-slate-700">{event.actor}</span>
                        {" · "}
                        <time dateTime={event.createdAt}>{formatDateTime(event.createdAt)}</time>
                    </p>
                </li>
            ))}
        </ol>
    );
}
