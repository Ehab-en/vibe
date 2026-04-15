/**
 * tests/PostCard.test.jsx — Test suite for the PostCard component
 *
 * Test 1: PostCard renders correctly with like button
 *
 * Covers:
 *  - The post card element is in the document
 *  - Author name and post text are visible
 *  - The like button is present and labelled correctly
 *  - The like count is displayed
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";

import PostCard from "../components/PostCard";
import authReducer from "../store/authSlice";
import postsReducer from "../store/postsSlice";

// ─── Test helpers ─────────────────────────────────────────────────────────────

/** Creates a minimal Redux store with a logged-in user for testing */
const makeStore = (currentUser = null) =>
  configureStore({
    reducer: { auth: authReducer, posts: postsReducer },
    preloadedState: {
      auth: {
        user: currentUser || {
          _id: "user-123",
          name: "Test User",
          username: "testuser",
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

/** Wraps a component with both Redux Provider and BrowserRouter */
const renderWithProviders = (ui, store) =>
  render(
    <Provider store={store}>
      <BrowserRouter>{ui}</BrowserRouter>
    </Provider>
  );

// ─── Sample post fixture ──────────────────────────────────────────────────────

const mockPost = {
  _id: "post-abc",
  author: {
    _id: "author-xyz",
    name: "Jane Doe",
    username: "janedoe",
    avatar: "",
  },
  text: "Hello Vibe! This is my first post. #vibe",
  image: "",
  location: {},
  likes: [],
  likesCount: 7,
  comments: [],
  isPublic: true,
  createdAt: new Date().toISOString(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("PostCard", () => {
  /**
   * Test 1 — PostCard renders correctly with like button
   *
   * Verifies that all key elements of a post card are visible
   * when the component is given a valid post prop.
   */
  it("renders the post card with author, text, and like button", () => {
    const store = makeStore();
    renderWithProviders(<PostCard post={mockPost} />, store);

    // The card wrapper should be in the DOM
    expect(screen.getByTestId("post-card")).toBeInTheDocument();

    // Author name should appear
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();

    // Post text should be visible (hashtag is rendered as a span, so query by role)
    expect(screen.getByText(/Hello Vibe!/i)).toBeInTheDocument();

    // Like button should exist and be accessible
    const likeBtn = screen.getByTestId("like-button");
    expect(likeBtn).toBeInTheDocument();
    expect(likeBtn).toHaveAttribute("aria-label", "Like post");

    // Like count should match the fixture
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  /**
   * Test 1b — Like button shows "Unlike post" when the post is already liked
   */
  it("shows 'Unlike post' label when the current user has already liked the post", () => {
    const store = makeStore({
      _id: "user-123",
      name: "Test User",
      username: "testuser",
      avatar: "",
    });

    const likedPost = { ...mockPost, likes: ["user-123"], likesCount: 8 };
    renderWithProviders(<PostCard post={likedPost} />, store);

    const likeBtn = screen.getByTestId("like-button");
    expect(likeBtn).toHaveAttribute("aria-label", "Unlike post");
  });

  /**
   * Test 1c — Comment button is rendered
   */
  it("renders the comment button", () => {
    const store = makeStore();
    renderWithProviders(<PostCard post={mockPost} />, store);

    expect(screen.getByTestId("comment-button")).toBeInTheDocument();
  });

  /**
   * Test 1d — Delete button is not shown to non-authors
   */
  it("does NOT show delete button to a non-author", () => {
    const store = makeStore(); // logged in as user-123, post author is author-xyz
    renderWithProviders(<PostCard post={mockPost} />, store);

    expect(screen.queryByTestId("delete-post-btn")).not.toBeInTheDocument();
  });
});
