import { BADGE_STYLES, humanize } from "../utils/constants.js";

const FALLBACK = "bg-slate-100 text-slate-700 ring-slate-500/20";

// kind: "category" | "priority" | "status"
export default function Badge({ kind, value }) {
    if (!value) return null;

    const style = BADGE_STYLES[kind]?.[value] || FALLBACK;

    return (
        <span
            className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
        >
            {kind === "priority" && value === "URGENT" && (
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
            )}
            {humanize(value)}
        </span>
    );
}
