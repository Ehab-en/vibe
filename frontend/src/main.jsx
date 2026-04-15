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
// Use the same hostname as the current page so the app works from any device
// on the same network (e.g. a phone at 192.168.0.102:3000 will hit :5000 on
// that same IP instead of hardcoded localhost).
axios.defaults.baseURL = `${window.location.protocol}//${window.location.hostname}:5000`;
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
