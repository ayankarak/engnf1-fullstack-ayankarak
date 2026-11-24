import { CATEGORIES, PRIORITIES, STATUSES, humanize } from "../utils/constants.js";

const selectClass =
    "w-full rounded-md border-0 py-2 pl-3 pr-8 text-sm text-slate-900 ring-1 ring-slate-300 focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
            {children}
        </label>
    );
}

export default function TriagePanel({ ticket, assignees, canEdit, saving, onChange }) {
    const disabled = !canEdit || saving;

    return (
        <div className="space-y-4">
            <Field label="Category">
                <select value={ticket.category} disabled={disabled} onChange={(e) => onChange({ category: e.target.value })} className={selectClass}>
                    {CATEGORIES.map((value) => (
                        <option key={value} value={value}>{humanize(value)}</option>
                    ))}
                </select>
            </Field>

            <Field label="Priority">
                <select value={ticket.priority} disabled={disabled} onChange={(e) => onChange({ priority: e.target.value })} className={selectClass}>
                    {PRIORITIES.map((value) => (
                        <option key={value} value={value}>{humanize(value)}</option>
                    ))}
                </select>
            </Field>

            <Field label="Status">
                <select value={ticket.status} disabled={disabled} onChange={(e) => onChange({ status: e.target.value })} className={selectClass}>
                    {STATUSES.map((value) => (
                        <option key={value} value={value}>{humanize(value)}</option>
                    ))}
                </select>
            </Field>

            <Field label="Assignee">
                <select
                    value={ticket.assigneeId ?? ""}
                    disabled={disabled}
                    onChange={(e) => onChange({ assigneeId: e.target.value === "" ? null : Number(e.target.value) })}
                    className={selectClass}
                >
                    <option value="">Unassigned</option>
                    {/* Keep the current assignee selectable even if the list has not loaded. */}
                    {ticket.assignee && !assignees.some((user) => user.id === ticket.assignee.id) && (
                        <option value={ticket.assignee.id}>{ticket.assignee.name}</option>
                    )}
                    {assignees.map((user) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                </select>
            </Field>

            <button
                type="button"
                disabled={disabled}
                aria-pressed={ticket.isReviewed}
                onClick={() => onChange({ isReviewed: !ticket.isReviewed })}
                className={`w-full rounded-md px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                    ticket.isReviewed
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30 hover:bg-emerald-100"
                        : "bg-indigo-600 text-white hover:bg-indigo-500"
                }`}
            >
                {ticket.isReviewed ? "Reviewed \u2713 (click to undo)" : "Mark as reviewed"}
            </button>

            {!canEdit && (
                <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    You have read-only access. Agents and admins can change tickets.
                </p>
            )}
        </div>
    );
}
