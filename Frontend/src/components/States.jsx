export function EmptyState({ title, message, action }) {
    return (
        <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M4 7h16M4 12h10M4 17h6" />
                </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {message && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export function ErrorState({ title = "Something went wrong", error, onRetry }) {
    return (
        <div className="px-6 py-12 text-center" role="alert">
            <h3 className="text-sm font-semibold text-red-700">{title}</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{error?.message || "Please try again."}</p>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-4 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-300 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                    Try again
                </button>
            )}
        </div>
    );
}

export function Spinner({ label = "Loading" }) {
    return (
        <div className="flex items-center justify-center py-16" role="status">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
            <span className="sr-only">{label}</span>
        </div>
    );
}
