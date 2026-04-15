/**
 * tests/LandingPage.test.jsx — Test suite for the LandingPage component
 *
 * Test 4: LandingPage shows login and register tabs
 *
 * Covers:
 *  - Both "Sign In" and "Register" tabs are rendered
 *  - The Login tab is active by default (email/password fields visible)
 *  - Clicking "Register" tab reveals the Name and Username fields
 *  - Clicking "Sign In" tab hides the register-only fields
 *  - Submit button text changes with the active tab
 *  - Error messages are displayed when the store contains an error
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";

import LandingPage from "../pages/LandingPage";
import authReducer from "../store/authSlice";
import postsReducer from "../store/postsSlice";
import notificationsReducer from "../store/notificationsSlice";

// ─── Test helper ─────────────────────────────────────────────────────────────

/**
 * Creates a Redux store with an optional error state.
 *
 * @param {{ error?: string|null }} options
 */
const makeStore = ({ error = null } = {}) =>
  configureStore({
    reducer: {
      auth: authReducer,
      posts: postsReducer,
      notifications: notificationsReducer,
    },
    preloadedState: {
      auth: { user: null, loading: false, error },
      posts: {
        feed: [], explore: [], userPosts: [], searchResults: [],
        trending: [], current: null, loading: false, error: null,
        page: 1, totalPages: 1,
      },
      notifications: { items: [], unreadCount: 0, loading: false, error: null },
    },
  });

/**
 * Renders the LandingPage wrapped in the required providers.
 * Uses MemoryRouter so we control the initial route.
 */
const renderLandingPage = (store) =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/"]}>
        <LandingPage />
      </MemoryRouter>
    </Provider>
  );

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("LandingPage", () => {
  /**
   * Test 4 — LandingPage shows login and register tabs (main test case)
   *
   * Both tab buttons must be present on the page.
   */
  it("renders both Sign In and Register tabs", () => {
    renderLandingPage(makeStore());

    // Both tabs should be in the document
    expect(screen.getByTestId("login-tab")).toBeInTheDocument();
    expect(screen.getByTestId("register-tab")).toBeInTheDocument();

    expect(screen.getByTestId("login-tab")).toHaveTextContent("Sign In");
    expect(screen.getByTestId("register-tab")).toHaveTextContent("Register");
  });

  /**
   * Test 4b — Login tab is active by default
   *
   * On initial render the email and password fields should be visible
   * but the Name and Username fields should be hidden.
   */
  it("shows email and password fields by default (login tab active)", () => {
    renderLandingPage(makeStore());

    expect(screen.getByTestId("email-input")).toBeInTheDocument();
    expect(screen.getByTestId("password-input")).toBeInTheDocument();

    // Register-only fields should NOT be present yet
    expect(screen.queryByTestId("register-name")).not.toBeInTheDocument();
    expect(screen.queryByTestId("register-username")).not.toBeInTheDocument();
  });

  /**
   * Test 4c — Clicking the Register tab reveals Name and Username fields
   */
  it("reveals Name and Username fields when the Register tab is clicked", () => {
    renderLandingPage(makeStore());

    // Switch to the Register tab
    fireEvent.click(screen.getByTestId("register-tab"));

    // Register-only fields should now be present
    expect(screen.getByTestId("register-name")).toBeInTheDocument();
    expect(screen.getByTestId("register-username")).toBeInTheDocument();

    // Shared fields should still be there
    expect(screen.getByTestId("email-input")).toBeInTheDocument();
    expect(screen.getByTestId("password-input")).toBeInTheDocument();
  });

  /**
   * Test 4d — Switching back to login tab hides the register-only fields
   */
  it("hides Name and Username fields after switching back to Sign In tab", () => {
    renderLandingPage(makeStore());

    // Go to register, then back to login
    fireEvent.click(screen.getByTestId("register-tab"));
    fireEvent.click(screen.getByTestId("login-tab"));

    expect(screen.queryByTestId("register-name")).not.toBeInTheDocument();
    expect(screen.queryByTestId("register-username")).not.toBeInTheDocument();
  });

  /**
   * Test 4e — Submit button text matches the active tab
   */
  it("updates the submit button label when switching tabs", () => {
    renderLandingPage(makeStore());

    // Default: Sign In tab
    expect(screen.getByTestId("auth-submit")).toHaveTextContent("Sign In");

    // Switch to Register
    fireEvent.click(screen.getByTestId("register-tab"));
    expect(screen.getByTestId("auth-submit")).toHaveTextContent("Create Account");
  });

  /**
   * Test 4f — Error message is shown when the Redux store contains an error
   */
  it("displays an error message from the Redux auth state", () => {
    renderLandingPage(makeStore({ error: "Invalid email or password" }));

    expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
  });
});
