// Must stay in sync with Backend/src/utils/constants.js.
export const CATEGORIES = ["BILLING", "BUG", "FEATURE_REQUEST", "LOGIN", "DELIVERY"];
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
export const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export const AUDITED_FIELDS = ["category", "priority", "status", "assigneeId"];

export const FIELD_LABELS = {
    category: "Category",
    priority: "Priority",
    status: "Status",
    assigneeId: "Assignee",
};

// "FEATURE_REQUEST" -> "Feature request"
export const humanize = (value) => {
    if (!value) return "";
    const text = String(value).toLowerCase().replace(/_/g, " ");
    return text.charAt(0).toUpperCase() + text.slice(1);
};

// Full class names (not built dynamically) so Tailwind can detect them.
export const BADGE_STYLES = {
    category: {
        BILLING: "bg-violet-50 text-violet-700 ring-violet-600/20",
        BUG: "bg-rose-50 text-rose-700 ring-rose-600/20",
        FEATURE_REQUEST: "bg-sky-50 text-sky-700 ring-sky-600/20",
        LOGIN: "bg-amber-50 text-amber-800 ring-amber-600/20",
        DELIVERY: "bg-teal-50 text-teal-700 ring-teal-600/20",
    },
    priority: {
        LOW: "bg-slate-100 text-slate-700 ring-slate-500/20",
        MEDIUM: "bg-blue-50 text-blue-700 ring-blue-600/20",
        HIGH: "bg-orange-50 text-orange-700 ring-orange-600/20",
        URGENT: "bg-red-50 text-red-700 ring-red-600/30",
    },
    status: {
        OPEN: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
        IN_PROGRESS: "bg-amber-50 text-amber-800 ring-amber-600/20",
        RESOLVED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
        CLOSED: "bg-slate-100 text-slate-600 ring-slate-500/20",
    },
};

export const PAGE_SIZES = [10, 25, 50];
export const DEFAULT_PAGE_SIZE = 10;
