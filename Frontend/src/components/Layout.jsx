import { Link, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { humanize } from "../utils/constants.js";

export default function Layout() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
                    <Link to="/" className="flex items-center gap-2 text-base font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M5 7h14M5 12h10M5 17h6" />
                            </svg>
                        </span>
                        TriageSync
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="hidden text-right leading-tight sm:block">
                            <p className="text-sm font-medium">{user?.name}</p>
                            <p className="text-xs text-slate-500">{humanize(user?.role)}</p>
                        </div>
                        <button
                            type="button"
                            onClick={logout}
                            className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
                <Outlet />
            </main>
        </div>
    );
}
