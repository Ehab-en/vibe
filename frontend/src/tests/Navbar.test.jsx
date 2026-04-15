/**
 * tests/Navbar.test.jsx — Test suite for the Navbar component
 *
 * Test 3: Navbar renders correct links when logged in
 *
 * Covers:
 *  - Brand logo "Vibe" is visible
 *  - Search form is rendered when user is authenticated
 *  - User avatar / name button is present
 *  - Dropdown contains Profile and Notifications links
 *  - Logout button is present in dropdown
 *  - Search form is NOT rendered when user is logged out
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";

import Navbar from "../components/Navbar";
import authReducer from "../store/authSlice";
import postsReducer from "../store/postsSlice";
import notificationsReducer from "../store/notificationsSlice";

// ─── Test helper ─────────────────────────────────────────────────────────────

/**
 * Builds a Redux store with a configurable auth state.
 *
 * @param {object|null} user — the logged-in user, or null for logged-out state
 */
const makeStore = (user = null) =>
  configureStore({
    reducer: {
      auth: authReducer,
      posts: postsReducer,
      notifications: notificationsReducer,
    },
    preloadedState: {
      auth: { user, loading: false, error: null },
      posts: {
        feed: [], explore: [], userPosts: [], searchResults: [],
        trending: [], current: null, loading: false, error: null,
        page: 1, totalPages: 1,
      },
      notifications: { items: [], unreadCount: 0, loading: false, error: null },
    },
  });

const loggedInUser = {
  _id: "user-001",
  name: "Alice Smith",
  username: "alicesmith",
  email: "alice@example.com",
  avatar: "",
};

const renderNavbar = (user) =>
  render(
    <Provider store={makeStore(user)}>
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    </Provider>
  );

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Navbar", () => {
  /**
   * Test 3 — Navbar renders correct links when logged in (main test case)
   *
   * Verifies all key authenticated UI elements are present.
   */
  it("renders brand logo, search bar, and user controls when logged in", () => {
    renderNavbar(loggedInUser);

    // Brand logo should be visible and link to /home
    const logo = screen.getByTestId("brand-logo");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveTextContent("Vibe");

    // Search form should be present for authenticated users
    expect(screen.getByTestId("search-form")).toBeInTheDocument();

    // Search input placeholder
    expect(
      screen.getByPlaceholderText("Search Vibe...")
    ).toBeInTheDocument();

    // User name should appear in the nav
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  /**
   * Test 3b — Dropdown shows Profile and Notifications links after click
   */
  it("opens a dropdown with Profile and Notifications links on avatar click", () => {
    renderNavbar(loggedInUser);

    // Click the avatar/name button to open the dropdown
    const avatarBtn = screen.getByLabelText("User menu");
    fireEvent.click(avatarBtn);

    // Dropdown links should now be visible
    expect(screen.getByTestId("nav-profile-link")).toBeInTheDocument();
    expect(screen.getByTestId("nav-notifications-link")).toBeInTheDocument();
    expect(screen.getByTestId("logout-button")).toBeInTheDocument();
  });

  /**
   * Test 3c — Logout button is present inside the dropdown
   */
  it("shows a Sign out button in the dropdown", () => {
    renderNavbar(loggedInUser);

    fireEvent.click(screen.getByLabelText("User menu"));

    const logoutBtn = screen.getByTestId("logout-button");
    expect(logoutBtn).toBeInTheDocument();
    expect(logoutBtn).toHaveTextContent("Sign out");
  });

  /**
   * Test 3d — Search form is NOT rendered when the user is logged out
   */
  it("does NOT render the search form when the user is logged out", () => {
    renderNavbar(null); // no user

    expect(screen.queryByTestId("search-form")).not.toBeInTheDocument();
  });

  /**
   * Test 3e — Brand logo is always visible regardless of auth state
   */
  it("always renders the brand logo even when logged out", () => {
    renderNavbar(null);

    expect(screen.getByTestId("brand-logo")).toBeInTheDocument();
    expect(screen.getByTestId("brand-logo")).toHaveTextContent("Vibe");
  });
});
