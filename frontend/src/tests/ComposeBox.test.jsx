/**
 * tests/ComposeBox.test.jsx — Test suite for the ComposeBox component
 *
 * Test 2: ComposeBox character counter updates on input
 *
 * Covers:
 *  - Initial counter shows 280 (MAX_CHARS)
 *  - Counter decrements as the user types
 *  - Counter turns negative and the submit button is disabled when over the limit
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import userEvent from "@testing-library/user-event";

import ComposeBox from "../components/ComposeBox";
import authReducer from "../store/authSlice";
import postsReducer from "../store/postsSlice";

// ─── Test helper ─────────────────────────────────────────────────────────────

/** Build a minimal store with a logged-in user */
const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer, posts: postsReducer },
    preloadedState: {
      auth: {
        user: {
          _id: "user-001",
          name: "Alice",
          username: "alice",
          avatar: "",
        },
        loading: false,
        error: null,
      },
      posts: {
        feed: [],
        explore: [],
        userPosts: [],
        searchResults: [],
        trending: [],
        current: null,
        loading: false,
        error: null,
        page: 1,
        totalPages: 1,
      },
    },
  });

const renderComposeBox = (store) =>
  render(
    <Provider store={store}>
      <BrowserRouter>
        <ComposeBox />
      </BrowserRouter>
    </Provider>
  );

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("ComposeBox", () => {
  /**
   * Test 2a — Initial counter starts at 280
   */
  it("shows 280 remaining characters initially", () => {
    renderComposeBox(makeStore());

    // The character counter should start at 280 (MAX_CHARS)
    expect(screen.getByTestId("char-counter")).toHaveTextContent("280");
  });

  /**
   * Test 2 — Character counter updates as user types (main test case)
   *
   * Types a 10-character string and verifies the counter drops to 270.
   */
  it("decrements the character counter as the user types", async () => {
    renderComposeBox(makeStore());

    const textarea = screen.getByTestId("compose-textarea");
    const tenChars = "1234567890";

    // Simulate typing into the textarea
    fireEvent.change(textarea, { target: { value: tenChars } });

    // Counter should now show 280 - 10 = 270
    expect(screen.getByTestId("char-counter")).toHaveTextContent("270");
  });

  /**
   * Test 2c — Counter shows a negative number when over the 280-char limit
   */
  it("shows a negative counter when text exceeds 280 characters", () => {
    renderComposeBox(makeStore());

    const textarea = screen.getByTestId("compose-textarea");
    const longText = "a".repeat(285); // 5 chars over limit

    fireEvent.change(textarea, { target: { value: longText } });

    // Counter should show -5
    expect(screen.getByTestId("char-counter")).toHaveTextContent("-5");
  });

  /**
   * Test 2d — Submit button is disabled when the post exceeds the character limit
   */
  it("disables the submit button when text is over the character limit", () => {
    renderComposeBox(makeStore());

    const textarea = screen.getByTestId("compose-textarea");
    const longText = "a".repeat(290);

    fireEvent.change(textarea, { target: { value: longText } });

    const submitBtn = screen.getByTestId("compose-submit");
    expect(submitBtn).toBeDisabled();
  });

  /**
   * Test 2e — Submit button is disabled when the textarea is empty
   */
  it("disables the submit button when the textarea is empty", () => {
    renderComposeBox(makeStore());

    const submitBtn = screen.getByTestId("compose-submit");
    expect(submitBtn).toBeDisabled();
  });
});
