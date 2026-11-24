import { Skeleton } from "./Skeleton.jsx";

const ACCENTS = {
    slate: "text-slate-900",
    indigo: "text-indigo-600",
    amber: "text-amber-600",
    emerald: "text-emerald-600",
    red: "text-red-600",
};

export default function StatCard({ label, value, accent = "slate", loading, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`rounded-xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                active ? "border-indigo-400 ring-1 ring-indigo-400" : "border-slate-200"
            }`}
        >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
            {loading ? (
                <Skeleton className="mt-2 h-8 w-14" />
            ) : (
                <p className={`mt-1 text-3xl font-semibold tabular-nums ${ACCENTS[accent]}`}>{value ?? "-"}</p>
            )}
        </button>
    );
}
