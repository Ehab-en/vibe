/**
 * store/index.js — Redux store configuration
 *
 * Combines all slices into the root reducer and exports
 * the configured store for use in main.jsx via <Provider>.
 */

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import postsReducer from "./postsSlice";
import notificationsReducer from "./notificationsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postsReducer,
    notifications: notificationsReducer,
  },
});

export default store;
