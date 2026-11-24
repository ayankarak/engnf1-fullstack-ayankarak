import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import * as authApi from "../api/auth.js";
import { setUnauthorizedHandler, tokenStore } from "../api/client.js";
import { useToast } from "./ToastContext.jsx";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const toast = useToast();
    const [user, setUser] = useState(null);
    const [status, setStatus] = useState(tokenStore.get() ? "loading" : "anonymous");

    // Restore the session after a page reload.
    useEffect(() => {
        if (!tokenStore.get()) return undefined;

        const controller = new AbortController();

        authApi
            .getMe(controller.signal)
            .then((data) => {
                setUser(data.user);
                setStatus("authenticated");
            })
            .catch((error) => {
                if (error.name === "AbortError") return;
                tokenStore.clear();
                setUser(null);
                setStatus("anonymous");
            });

        return () => controller.abort();
    }, []);

    // Any 401 from the API means the session is gone.
    useEffect(() => {
        setUnauthorizedHandler(() => {
            tokenStore.clear();
            setUser(null);
            setStatus("anonymous");
            toast.info("Your session has expired. Please sign in again.");
        });

        return () => setUnauthorizedHandler(null);
    }, [toast]);

    const login = useCallback(async (email, password) => {
        const data = await authApi.login(email, password);
        tokenStore.set(data.token);
        setUser(data.user);
        setStatus("authenticated");
    }, []);

    const register = useCallback(
        async (name, email, password) => {
            await authApi.register(name, email, password);
            await login(email, password);
        },
        [login]
    );

    const logout = useCallback(() => {
        tokenStore.clear();
        setUser(null);
        setStatus("anonymous");
    }, []);

    const value = useMemo(
        () => ({
            user,
            status,
            login,
            register,
            logout,
            // USER = read only, AGENT = triage, ADMIN = triage + delete
            canTriage: user?.role === "AGENT" || user?.role === "ADMIN",
            isAdmin: user?.role === "ADMIN",
        }),
        [user, status, login, register, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
    return context;
};
