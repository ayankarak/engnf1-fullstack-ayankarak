import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");

    return {
        plugins: [react(), tailwindcss()],
        server: {
            port: 5173,
            // In development "/api" is proxied to the Express backend, so no CORS setup is needed.
            proxy: {
                "/api": {
                    target: env.VITE_PROXY_TARGET || "http://localhost:5000",
                    changeOrigin: true,
                },
            },
        },
    };
});
