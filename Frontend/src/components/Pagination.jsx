import { PAGE_SIZES } from "../utils/constants.js";

const buttonClass =
    "rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

export default function Pagination({ pagination, onPageChange, onLimitChange }) {
    if (!pagination) return null;

    const { total, page, limit, totalPages } = pagination;
    const first = total === 0 ? 0 : (page - 1) * limit + 1;
    const last = Math.min(page * limit, total);

    return (
        <nav
            className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row"
            aria-label="Pagination"
        >
            <p className="text-sm text-slate-600">
                {total === 0 ? "No tickets" : `Showing ${first}-${last} of ${total}`}
            </p>

            <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                    Per page
                    <select
                        value={limit}
                        onChange={(event) => onLimitChange(Number(event.target.value))}
                        className="rounded-md border-0 py-1 pl-2 pr-7 text-sm ring-1 ring-slate-300 focus:ring-2 focus:ring-indigo-500"
                    >
                        {PAGE_SIZES.map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </label>

                <button type="button" className={buttonClass} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                    Previous
                </button>
                <span className="text-sm tabular-nums text-slate-600">
                    Page {page} of {Math.max(totalPages, 1)}
                </span>
                <button
                    type="button"
                    className={buttonClass}
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    Next
                </button>
            </div>
        </nav>
    );
}
