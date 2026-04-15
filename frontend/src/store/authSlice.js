/**
 * store/authSlice.js — Redux slice for authentication state
 *
 * State shape:
 *   user    — the authenticated user object (null if not logged in)
 *   loading — true while an async auth request is in flight
 *   error   — string error message from the last failed request
 *
 * Async thunks:
 *   fetchCurrentUser — GET /api/auth/me  (restore session from cookie)
 *   loginUser        — POST /api/auth/login
 *   registerUser     — POST /api/auth/register
 *   logoutUser       — POST /api/auth/logout
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Base URL for all auth API calls
const AUTH_BASE = "/api/auth";

// ─── Async Thunks ─────────────────────────────────────────────────────────────

/**
 * Fetches the currently authenticated user from the server using the
 * httpOnly cookie set at login. Silently fails if not logged in.
 */
export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${AUTH_BASE}/me`, { withCredentials: true });
      return data;
    } catch {
      return rejectWithValue(null); // not logged in — not an error
    }
  }
);

/**
 * Logs in with email + password. On success the server sets the JWT cookie.
 * @param {{ email: string, password: string }} credentials
 */
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(`${AUTH_BASE}/login`, credentials, {
        withCredentials: true,
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

/**
 * Registers a new account. On success the server sets the JWT cookie.
 * @param {{ name: string, username: string, email: string, password: string }} userData
 */
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(`${AUTH_BASE}/register`, userData, {
        withCredentials: true,
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Registration failed");
    }
  }
);

/**
 * Logs out by asking the server to clear the JWT cookie.
 */
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await axios.post(`${AUTH_BASE}/logout`, {}, { withCredentials: true });
    } catch (err) {
      return rejectWithValue("Logout failed");
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    loading: true,  // start as true so we wait for the session check before rendering
    error: null,
  },

  reducers: {
    /**
     * Clears any previous auth error message.
     * Useful to call when the user starts typing in the login form.
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Directly update the user in state (e.g. after a profile edit).
     * @param {object} action.payload — updated user object
     */
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },

  extraReducers: (builder) => {
    // ── fetchCurrentUser ──────────────────────────────────────────────────────
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload; // null if not logged in
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
      });

    // ── loginUser ─────────────────────────────────────────────────────────────
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── registerUser ──────────────────────────────────────────────────────────
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── logoutUser ────────────────────────────────────────────────────────────
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.loading = false;
      });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
