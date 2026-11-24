import { CATEGORIES, PRIORITIES, STATUSES, humanize } from "../utils/constants.js";

const selectClass =
    "w-full rounded-md border-0 py-2 pl-3 pr-8 text-sm text-slate-900 ring-1 ring-slate-300 focus:ring-2 focus:ring-indigo-500";

function FilterSelect({ label, value, options, onChange }) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
            <select value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>
                <option value="">All</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {humanize(option)}
                    </option>
                ))}
            </select>
        </label>
    );
}

export default function TicketFilters({ searchText, onSearchChange, filters, onFilterChange, onClear, hasFilters }) {
    return (
        <div className="grid grid-cols-1 gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end">
            <label className="block sm:col-span-2 lg:col-span-1">
                <span className="mb-1 block text-xs font-medium text-slate-600">Search subject and description</span>
                <input
                    type="search"
                    value={searchText}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="e.g. crash, refund, tracking"
                    maxLength={100}
                    className="w-full rounded-md border-0 py-2 px-3 text-sm text-slate-900 ring-1 ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
                />
            </label>

            <FilterSelect label="Status" value={filters.status} options={STATUSES} onChange={(v) => onFilterChange("status", v)} />
            <FilterSelect label="Category" value={filters.category} options={CATEGORIES} onChange={(v) => onFilterChange("category", v)} />
            <FilterSelect label="Priority" value={filters.priority} options={PRIORITIES} onChange={(v) => onFilterChange("priority", v)} />

            <button
                type="button"
                onClick={onClear}
                disabled={!hasFilters}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
                Clear
            </button>
        </div>
    );
}
