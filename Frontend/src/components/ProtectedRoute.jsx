import { Navigate, Outlet, useLocation } from "react-router-dom";

import { Spinner } from "./States.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute() {
    const { status } = useAuth();
    const location = useLocation();

    if (status === "loading") return <Spinner label="Checking your session" />;
    if (status !== "authenticated") return <Navigate to="/login" replace state={{ from: location }} />;

    return <Outlet />;
}
