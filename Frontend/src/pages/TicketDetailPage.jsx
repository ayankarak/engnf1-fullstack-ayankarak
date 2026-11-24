import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { deleteTicket } from "../api/tickets.js";
import AuditTimeline from "../components/AuditTimeline.jsx";
import Badge from "../components/Badge.jsx";
import { Skeleton } from "../components/Skeleton.jsx";
import { ErrorState } from "../components/States.jsx";
import TriagePanel from "../components/TriagePanel.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useAssignees } from "../hooks/useAssignees.js";
import { useTicketDetail } from "../hooks/useTicketDetail.js";
import { humanize } from "../utils/constants.js";
import { formatDateTime } from "../utils/format.js";

function Card({ title, children, aside }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
                {aside}
            </div>
            {children}
        </section>
    );
}

function Meta({ label, children }) {
    return (
        <div className="flex justify-between gap-4 py-2 text-sm">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-medium text-slate-800">{children}</dd>
        </div>
    );
}

function DetailSkeleton() {
    return (
        <div className="grid gap-6 lg:grid-cols-3" role="status" aria-label="Loading ticket">
            <div className="space-y-6 lg:col-span-2">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-56 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
        </div>
    );
}

export default function TicketDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { canTriage, isAdmin } = useAuth();

    const assignees = useAssignees(canTriage);
    const { ticket, loading, error, saving, updateTicket, reload } = useTicketDetail(id, assignees);
    const [deleting, setDeleting] = useState(false);

    const remove = async () => {
        if (!window.confirm("Delete this ticket? It disappears from the dashboard; its audit history is kept.")) return;

        setDeleting(true);
        try {
            await deleteTicket(ticket.id);
            toast.success(`Ticket #${ticket.id} deleted`);
            navigate("/");
        } catch (err) {
            toast.error(`Could not delete ticket: ${err.message}`);
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-indigo-600 focus:outline-none focus-visible:underline">
                &larr; Back to tickets
            </Link>

            {loading && !ticket && <DetailSkeleton />}

            {error && !ticket && (
                <div className="rounded-xl border border-slate-200 bg-white">
                    <ErrorState
                        title={error.status === 404 ? "Ticket not found" : "Could not load ticket"}
                        error={error}
                        onRetry={error.status === 404 ? undefined : reload}
                    />
                </div>
            )}

            {ticket && (
                <>
                    <header className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge kind="category" value={ticket.category} />
                            <Badge kind="priority" value={ticket.priority} />
                            <Badge kind="status" value={ticket.status} />
                            {ticket.isReviewed && (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                    Reviewed
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-semibold text-slate-900">{ticket.subject}</h1>
                    </header>

                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="space-y-6 lg:col-span-2">
                            <Card title="Description">
                                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{ticket.body}</p>
                            </Card>

                            <Card
                                title="Audit history"
                                aside={<span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Read-only</span>}
                            >
                                <AuditTimeline events={ticket.events} />
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card title="Triage">
                                <TriagePanel ticket={ticket} assignees={assignees} canEdit={canTriage} saving={saving} onChange={updateTicket} />
                            </Card>

                            <Card title="Details">
                                <dl className="divide-y divide-slate-100">
                                    <Meta label="Ticket ID">#{ticket.id}</Meta>
                                    <Meta label="External ID"><span className="break-all">{ticket.externalId}</span></Meta>
                                    <Meta label="Assignee">{ticket.assignee?.name || <span className="font-normal text-slate-400">Unassigned</span>}</Meta>
                                    <Meta label="Reviewed">{ticket.isReviewed ? "Yes" : "No"}</Meta>
                                    <Meta label="Category source">
                                        {ticket.isHumanOverride ? "Manually overridden" : "Automatically classified"}
                                    </Meta>
                                    <Meta label="Created">{formatDateTime(ticket.createdAt)}</Meta>
                                    <Meta label="Updated">{formatDateTime(ticket.updatedAt)}</Meta>
                                </dl>

                                {ticket.isHumanOverride && (
                                    <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                        An agent set the category. Re-imports will not change it. The automatic classifier
                                        suggests <strong>{humanize(ticket.autoCategory)}</strong>.
                                    </p>
                                )}
                            </Card>

                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={remove}
                                    disabled={deleting}
                                    className="w-full rounded-md px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-red-300 transition hover:bg-red-50 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                >
                                    {deleting ? "Deleting..." : "Delete ticket"}
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
