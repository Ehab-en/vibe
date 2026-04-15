/**
 * main.jsx — Application entry point
 *
 * Wraps the React tree in:
 *   • Redux <Provider>     — makes the store available to all components
 *   • <BrowserRouter>      — enables client-side routing
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import App from "./App";
import { store } from "./store";
import "./index.css";

// ─── Axios global base URL ────────────────────────────────────────────────────
// VITE_API_URL is baked into the bundle at build time via the Dockerfile ARG.
// If the build arg wasn't passed (or Vite left it undefined), fall back to the
// backend's direct URL so the browser always reaches Express on port 5000.
axios.defaults.baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";
// Always send the httpOnly JWT cookie on every cross-origin request
axios.defaults.withCredentials = true;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
