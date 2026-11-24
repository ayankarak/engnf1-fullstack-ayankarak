import { useEffect, useState } from "react";

import { createTicket } from "../api/tickets.js";

const inputClass =
    "w-full rounded-md border-0 px-3 py-2 text-sm text-slate-900 ring-1 ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500";

export default function CreateTicketDialog({ onClose, onCreated }) {
    const [form, setForm] = useState({ subject: "", body: "", externalId: "" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const onKey = (event) => event.key === "Escape" && !submitting && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose, submitting]);

    const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

    const submit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const payload = { subject: form.subject, body: form.body };
            if (form.externalId.trim()) payload.externalId = form.externalId.trim();

            const data = await createTicket(payload);
            onCreated(data.ticket);
        } catch (err) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    return (
        <div className="animate-fade-in fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !submitting && onClose()}>
            <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="new-ticket-title" className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-xl">
                <div>
                    <h2 id="new-ticket-title" className="text-lg font-semibold text-slate-900">New ticket</h2>
                    <p className="text-sm text-slate-500">Category and priority are assigned automatically from the text.</p>
                </div>

                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Subject</span>
                    <input required autoFocus maxLength={150} value={form.subject} onChange={set("subject")} className={inputClass} />
                </label>

                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Description</span>
                    <textarea required rows={5} maxLength={20000} value={form.body} onChange={set("body")} className={inputClass} />
                </label>

                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">External ID (optional)</span>
                    <input maxLength={100} value={form.externalId} onChange={set("externalId")} placeholder="Generated if left empty" className={inputClass} />
                </label>

                {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} disabled={submitting} className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-50">
                        Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60">
                        {submitting ? "Creating..." : "Create ticket"}
                    </button>
                </div>
            </form>
        </div>
    );
}
