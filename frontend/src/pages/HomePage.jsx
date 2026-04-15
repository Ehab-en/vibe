/**
 * pages/HomePage.jsx — Authenticated home feed
 *
 * Layout: three-column
 *   Left  — Sidebar nav
 *   Center — ComposeBox + paginated PostCard feed
 *   Right  — TrendingWidget + SuggestWidget
 *
 * Fetches the first page of feed posts on mount and supports
 * infinite-scroll-style "Load more" pagination.
 */

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFeed } from "../store/postsSlice";
import { fetchNotifications } from "../store/notificationsSlice";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ComposeBox from "../components/ComposeBox";
import PostCard from "../components/PostCard";
import TrendingWidget from "../components/TrendingWidget";
import SuggestWidget from "../components/SuggestWidget";

const HomePage = () => {
  const dispatch = useDispatch();
  const { feed, loading, page, totalPages } = useSelector((state) => state.posts);

  // Load feed and notifications on mount
  useEffect(() => {
    dispatch(fetchFeed(1));
    dispatch(fetchNotifications());
  }, [dispatch]);

  /**
   * Loads the next page of feed posts (appended to the existing list).
   */
  const loadMore = () => {
    if (page < totalPages) {
      dispatch(fetchFeed(page + 1));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      {/* Main content — offset by the fixed navbar height (56px = h-14) */}
      <div className="max-w-6xl mx-auto pt-16 px-4">
        <div className="flex gap-6 py-6">
          {/* ── Left: navigation sidebar ──────────────────────────────────── */}
          <Sidebar />

          {/* ── Center: feed ──────────────────────────────────────────────── */}
          <main className="flex-1 flex flex-col gap-4 min-w-0">
            {/* Quick composer */}
            <ComposeBox />

            {/* Loading skeleton */}
            {loading && feed.length === 0 && (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="card p-4 animate-pulse">
                    <div className="flex gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                      </div>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                  </div>
                ))}
              </div>
            )}

            {/* Post cards */}
            {feed.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}

            {/* Empty state */}
            {!loading && feed.length === 0 && (
              <div className="card p-12 text-center">
                <p className="text-2xl mb-2">👋</p>
                <p className="font-semibold text-gray-700 dark:text-gray-200">Your feed is empty</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Follow some people on the Explore page to see their posts here.
                </p>
              </div>
            )}

            {/* Load more button */}
            {page < totalPages && (
              <button
                onClick={loadMore}
                disabled={loading}
                className="btn-outline w-full py-3 text-sm"
              >
                {loading ? "Loading…" : "Load more posts"}
              </button>
            )}
          </main>

          {/* ── Right: widgets ────────────────────────────────────────────── */}
          <aside className="w-72 shrink-0 hidden xl:flex flex-col gap-4">
            <TrendingWidget />
            <SuggestWidget />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
