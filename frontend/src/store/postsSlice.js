/**
 * store/postsSlice.js — Redux slice for posts state
 *
 * State shape:
 *   feed      — array of posts for the home feed
 *   explore   — array of posts for the explore page
 *   current   — a single post (used on detail views)
 *   loading   — async request in flight
 *   error     — last error message
 *   page      — current feed page number (for pagination)
 *   totalPages— total pages available for the feed
 *
 * Async thunks:
 *   fetchFeed, fetchExplore, fetchUserPosts
 *   createPost, updatePost, deletePost
 *   likePost, commentPost
 *   searchPosts, getTrending
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const POSTS_BASE = "/api/posts";

// ─── Async Thunks ─────────────────────────────────────────────────────────────

/** Fetches the home feed for the authenticated user. */
export const fetchFeed = createAsyncThunk(
  "posts/fetchFeed",
  async (page = 1, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${POSTS_BASE}/feed?page=${page}`, {
        withCredentials: true,
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load feed");
    }
  }
);

/** Fetches all public posts for the Explore page. */
export const fetchExplore = createAsyncThunk(
  "posts/fetchExplore",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${POSTS_BASE}/explore`, { withCredentials: true });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load explore");
    }
  }
);

/** Fetches all posts authored by a given user ID (for the Profile page). */
export const fetchUserPosts = createAsyncThunk(
  "posts/fetchUserPosts",
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${POSTS_BASE}/user/${userId}`, {
        withCredentials: true,
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load user posts");
    }
  }
);

/** Creates a new post. */
export const createPost = createAsyncThunk(
  "posts/createPost",
  async (postData, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(POSTS_BASE, postData, { withCredentials: true });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create post");
    }
  }
);

/** Deletes a post by ID. */
export const deletePost = createAsyncThunk(
  "posts/deletePost",
  async (postId, { rejectWithValue }) => {
    try {
      await axios.delete(`${POSTS_BASE}/${postId}`, { withCredentials: true });
      return postId; // return the ID so we can remove it from state
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete post");
    }
  }
);

/**
 * Toggles a like on a post.
 * Returns { postId, likes, likesCount } to update the post in state.
 */
export const likePost = createAsyncThunk(
  "posts/likePost",
  async (postId, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(`${POSTS_BASE}/${postId}/like`, {}, {
        withCredentials: true,
      });
      return { postId, ...data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to toggle like");
    }
  }
);

/**
 * Adds a comment to a post.
 * Returns { postId, comments } to update the post in state.
 */
export const commentPost = createAsyncThunk(
  "posts/commentPost",
  async ({ postId, text }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(
        `${POSTS_BASE}/${postId}/comment`,
        { text },
        { withCredentials: true }
      );
      return { postId, comments: data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to add comment");
    }
  }
);

/** Full-text search for posts. */
export const searchPosts = createAsyncThunk(
  "posts/searchPosts",
  async (query, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${POSTS_BASE}/search?q=${encodeURIComponent(query)}`, {
        withCredentials: true,
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Search failed");
    }
  }
);

/** Fetches the top trending hashtags. */
export const getTrending = createAsyncThunk(
  "posts/getTrending",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${POSTS_BASE}/trending`, { withCredentials: true });
      return data;
    } catch (err) {
      return rejectWithValue("Failed to fetch trending");
    }
  }
);

// ─── Helper: patch a post inside an array ─────────────────────────────────────

/**
 * Finds a post by ID in an array and applies a partial update.
 * Returns a new array (immutable update).
 *
 * @param {Array} arr      — the posts array to search
 * @param {string} id      — post ID to match
 * @param {object} changes — fields to merge into the found post
 */
const patchPost = (arr, id, changes) =>
  arr.map((p) => (p._id === id ? { ...p, ...changes } : p));

// ─── Slice ────────────────────────────────────────────────────────────────────

const postsSlice = createSlice({
  name: "posts",
  initialState: {
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

  reducers: {
    /** Clear any previous search results when the user navigates away */
    clearSearch: (state) => {
      state.searchResults = [];
    },
  },

  extraReducers: (builder) => {
    // ── fetchFeed ──────────────────────────────────────────────────────────────
    builder
      .addCase(fetchFeed.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.loading = false;
        // Guard: ensure posts is always an array even if the payload is malformed
        const posts = Array.isArray(action.payload?.posts) ? action.payload.posts : [];
        // If page 1 replace the list; otherwise append (infinite scroll)
        if (action.payload?.page === 1) {
          state.feed = posts;
        } else {
          state.feed = [...state.feed, ...posts];
        }
        state.page = action.payload?.page ?? 1;
        state.totalPages = action.payload?.totalPages ?? 1;
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── fetchExplore ───────────────────────────────────────────────────────────
    builder
      .addCase(fetchExplore.fulfilled, (state, action) => {
        state.explore = Array.isArray(action.payload) ? action.payload : [];
      });

    // ── fetchUserPosts ─────────────────────────────────────────────────────────
    builder
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        state.userPosts = Array.isArray(action.payload) ? action.payload : [];
      });

    // ── createPost — prepend to the feed ──────────────────────────────────────
    builder
      .addCase(createPost.fulfilled, (state, action) => {
        state.feed = [action.payload, ...state.feed];
      });

    // ── deletePost — remove from all lists ────────────────────────────────────
    builder
      .addCase(deletePost.fulfilled, (state, action) => {
        const id = action.payload;
        state.feed = state.feed.filter((p) => p._id !== id);
        state.explore = state.explore.filter((p) => p._id !== id);
        state.userPosts = state.userPosts.filter((p) => p._id !== id);
      });

    // ── likePost — update likes in all lists ──────────────────────────────────
    builder
      .addCase(likePost.fulfilled, (state, action) => {
        const { postId, likes, likesCount } = action.payload;
        const patch = { likes, likesCount };
        state.feed = patchPost(state.feed, postId, patch);
        state.explore = patchPost(state.explore, postId, patch);
        state.userPosts = patchPost(state.userPosts, postId, patch);
      });

    // ── commentPost — update comments in all lists ────────────────────────────
    builder
      .addCase(commentPost.fulfilled, (state, action) => {
        const { postId, comments } = action.payload;
        state.feed = patchPost(state.feed, postId, { comments });
        state.explore = patchPost(state.explore, postId, { comments });
        state.userPosts = patchPost(state.userPosts, postId, { comments });
      });

    // ── searchPosts ────────────────────────────────────────────────────────────
    builder
      .addCase(searchPosts.fulfilled, (state, action) => {
        state.searchResults = Array.isArray(action.payload) ? action.payload : [];
      });

    // ── getTrending ────────────────────────────────────────────────────────────
    builder
      .addCase(getTrending.fulfilled, (state, action) => {
        // Guard: the API returns an array of { tag, count } objects.
        // Default to [] if the response is missing or not an array.
        state.trending = Array.isArray(action.payload) ? action.payload : [];
      });
  },
});

export const { clearSearch } = postsSlice.actions;
export default postsSlice.reducer;
