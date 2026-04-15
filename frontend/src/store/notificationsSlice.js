/**
 * store/notificationsSlice.js — Redux slice for notifications state
 *
 * State shape:
 *   items       — array of notification objects
 *   unreadCount — number of unread notifications (for badge display)
 *   loading     — async request in flight
 *   error       — last error message
 *
 * Async thunks:
 *   fetchNotifications — load all notifications for current user
 *   markRead           — mark a single notification read
 *   markAllRead        — mark all notifications read
 *   deleteNotification — remove one notification
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const NOTIF_BASE = "/api/notifications";

// ─── Async Thunks ─────────────────────────────────────────────────────────────

/** Fetches all notifications for the current user (newest first). */
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(NOTIF_BASE, { withCredentials: true });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load notifications");
    }
  }
);

/** Marks a single notification as read by its ID. */
export const markRead = createAsyncThunk(
  "notifications/markRead",
  async (notifId, { rejectWithValue }) => {
    try {
      const { data } = await axios.put(`${NOTIF_BASE}/${notifId}/read`, {}, {
        withCredentials: true,
      });
      return data;
    } catch (err) {
      return rejectWithValue("Failed to mark as read");
    }
  }
);

/** Marks all unread notifications as read. */
export const markAllRead = createAsyncThunk(
  "notifications/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      await axios.put(`${NOTIF_BASE}/read-all`, {}, { withCredentials: true });
    } catch (err) {
      return rejectWithValue("Failed to mark all as read");
    }
  }
);

/** Permanently deletes a notification. */
export const deleteNotification = createAsyncThunk(
  "notifications/delete",
  async (notifId, { rejectWithValue }) => {
    try {
      await axios.delete(`${NOTIF_BASE}/${notifId}`, { withCredentials: true });
      return notifId;
    } catch (err) {
      return rejectWithValue("Failed to delete notification");
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },

  reducers: {},

  extraReducers: (builder) => {
    // ── fetchNotifications ─────────────────────────────────────────────────────
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        // Guard: default to [] if payload is not an array (e.g. unexpected API shape)
        const items = Array.isArray(action.payload) ? action.payload : [];
        state.items = items;
        state.unreadCount = items.filter((n) => !n.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── markRead — flip a single notification and decrement the badge ──────────
    builder.addCase(markRead.fulfilled, (state, action) => {
      const idx = state.items.findIndex((n) => n._id === action.payload._id);
      if (idx !== -1) {
        // Only decrement if it was previously unread
        if (!state.items[idx].isRead) state.unreadCount = Math.max(0, state.unreadCount - 1);
        state.items[idx] = action.payload;
      }
    });

    // ── markAllRead — zero out the badge and flip all items ───────────────────
    builder.addCase(markAllRead.fulfilled, (state) => {
      state.unreadCount = 0;
      state.items = state.items.map((n) => ({ ...n, isRead: true }));
    });

    // ── deleteNotification — remove from the list ──────────────────────────────
    builder.addCase(deleteNotification.fulfilled, (state, action) => {
      const removed = state.items.find((n) => n._id === action.payload);
      if (removed && !removed.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.items = state.items.filter((n) => n._id !== action.payload);
    });
  },
});

export default notificationsSlice.reducer;
