import { Link } from "react-router-dom";

export default function NotFoundPage() {
    return (
        <div className="py-20 text-center">
            <p className="text-sm font-semibold text-indigo-600">404</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Page not found</h1>
            <p className="mt-2 text-sm text-slate-500">The page you are looking for does not exist.</p>
            <Link to="/" className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:underline">
                Go to tickets
            </Link>
        </div>
    );
}
