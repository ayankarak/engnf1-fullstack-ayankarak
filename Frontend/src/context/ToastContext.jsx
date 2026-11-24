import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

let nextId = 1;

const STYLES = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-red-200 bg-red-50 text-red-900",
    info: "border-slate-200 bg-white text-slate-900",
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const push = useCallback(
        (type, message) => {
            const id = nextId++;
            setToasts((current) => [...current.slice(-3), { id, type, message }]);
            setTimeout(() => dismiss(id), type === "error" ? 7000 : 4000);
        },
        [dismiss]
    );

    const api = useMemo(
        () => ({
            success: (message) => push("success", message),
            error: (message) => push("error", message),
            info: (message) => push("info", message),
        }),
        [push]
    );

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div
                className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
                aria-live="polite"
            >
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        role={toast.type === "error" ? "alert" : "status"}
                        className={`animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${STYLES[toast.type]}`}
                    >
                        <p className="flex-1">{toast.message}</p>
                        <button
                            type="button"
                            onClick={() => dismiss(toast.id)}
                            className="rounded text-lg leading-none opacity-60 transition hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                            aria-label="Dismiss notification"
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used inside <ToastProvider>");
    return context;
};
