import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

const inputClass =
    "w-full rounded-md border-0 px-3 py-2 text-sm text-slate-900 ring-1 ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500";

export default function LoginPage() {
    const { status, login, register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [mode, setMode] = useState("login");
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const destination = location.state?.from?.pathname || "/";

    if (status === "authenticated") return <Navigate to={destination} replace />;

    const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

    const submit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            if (mode === "login") {
                await login(form.email, form.password);
            } else {
                await register(form.name, form.email, form.password);
            }
            navigate(destination, { replace: true });
        } catch (err) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    const isLogin = mode === "login";

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-sm">
                <div className="mb-6 text-center">
                    <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white" aria-hidden="true">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M5 7h14M5 12h10M5 17h6" />
                        </svg>
                    </span>
                    <h1 className="text-2xl font-semibold text-slate-900">TriageSync</h1>
                    <p className="mt-1 text-sm text-slate-500">Support ticket triage</p>
                </div>

                <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 text-sm font-medium" role="tablist">
                        {[["login", "Sign in"], ["register", "Create account"]].map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                role="tab"
                                aria-selected={mode === value}
                                onClick={() => { setMode(value); setError(null); }}
                                className={`rounded-md py-1.5 transition ${mode === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {!isLogin && (
                        <label className="block">
                            <span className="mb-1 block text-xs font-medium text-slate-600">Name</span>
                            <input required minLength={2} maxLength={50} autoComplete="name" value={form.name} onChange={set("name")} className={inputClass} />
                        </label>
                    )}

                    <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-600">Email</span>
                        <input required type="email" autoComplete="email" value={form.email} onChange={set("email")} className={inputClass} />
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-600">Password</span>
                        <input
                            required
                            type="password"
                            minLength={isLogin ? 1 : 8}
                            maxLength={72}
                            autoComplete={isLogin ? "current-password" : "new-password"}
                            value={form.password}
                            onChange={set("password")}
                            className={inputClass}
                        />
                        {!isLogin && <span className="mt-1 block text-xs text-slate-500">At least 8 characters.</span>}
                    </label>

                    {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    >
                        {submitting ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
                    </button>

                    {!isLogin && (
                        <p className="text-xs text-slate-500">
                            New accounts have read-only access. An admin can grant agent rights.
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
