/**
 * vite.config.js — Vite build configuration for the Vibe frontend
 *
 * Enables the React plugin and proxies /api requests to the backend
 * during local development so CORS cookies work correctly.
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Proxy API calls to Express backend during dev (avoids CORS issues)
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
