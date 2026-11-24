export function Skeleton({ className = "" }) {
    return <div className={`animate-pulse rounded bg-slate-200 ${className}`} aria-hidden="true" />;
}

export function TableSkeleton({ rows = 6 }) {
    return (
        <div className="divide-y divide-slate-100" role="status" aria-label="Loading tickets">
            {Array.from({ length: rows }, (_, index) => (
                <div key={index} className="flex items-center gap-4 px-4 py-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="hidden h-5 w-20 md:block" />
                    <Skeleton className="hidden h-5 w-16 md:block" />
                    <Skeleton className="h-5 w-20" />
                </div>
            ))}
        </div>
    );
}
