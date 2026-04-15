/**
 * App.jsx — Root component and client-side routing configuration
 *
 * On mount, checks if the user is already logged in (via GET /api/auth/me)
 * and dispatches the result to the Redux auth slice.
 *
 * Route structure:
 *   /          → LandingPage  (public)
 *   /home      → HomePage     (protected)
 *   /explore   → ExplorePage  (protected)
 *   /create    → CreatePostPage (protected)
 *   /notifications → NotificationsPage (protected)
 *   /profile/:username → ProfilePage (protected)
 */

import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCurrentUser } from "./store/authSlice";

import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import ProfilePage from "./pages/ProfilePage";
import CreatePostPage from "./pages/CreatePostPage";
import NotificationsPage from "./pages/NotificationsPage";

/**
 * ProtectedRoute — Redirects unauthenticated users to the landing page.
 *
 * @param {{ children: React.ReactNode }} props
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useSelector((state) => state.auth);

  // While we're checking auth status, show nothing (or a spinner)
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? children : <Navigate to="/" replace />;
};

/**
 * App — Top-level route tree.
 * Fetches the current user from the server on first render.
 */
const App = () => {
  const dispatch = useDispatch();

  // Attempt to restore session from the httpOnly cookie on page load
  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  // Initialize dark mode from localStorage on first render
  useEffect(() => {
    const saved = localStorage.getItem("vibeTheme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />

      {/* Protected */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/explore"
        element={
          <ProtectedRoute>
            <ExplorePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create"
        element={
          <ProtectedRoute>
            <CreatePostPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:username"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all → home if authenticated, landing otherwise */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
