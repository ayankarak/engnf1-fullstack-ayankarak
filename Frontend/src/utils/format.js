export const formatDateTime = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const timeAgo = (value, now = Date.now()) => {
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) return "-";

    const seconds = Math.max(0, Math.round((now - time) / 1000));
    if (seconds < 60) return "just now";

    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} h ago`;

    const days = Math.round(hours / 24);
    if (days < 30) return `${days} d ago`;

    return formatDateTime(value);
};
