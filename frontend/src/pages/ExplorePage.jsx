/**
 * pages/ExplorePage.jsx — Explore / Discovery page
 *
 * Sections:
 *  1. Search bar (pre-filled from URL query param ?q=…)
 *  2. Trending hashtags grid (top 10)
 *  3. People suggestions ("Who to Follow")
 *  4. Nearby posts sidebar (posts from the explore feed)
 *  5. Search results (replaces sections 2-4 while a query is active)
 */

import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchExplore,
  getTrending,
  searchPosts,
  clearSearch,
} from "../store/postsSlice";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import PostCard from "../components/PostCard";
import SuggestWidget from "../components/SuggestWidget";

const ExplorePage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { explore, trending, searchResults } = useSelector((state) => state.posts);

  // Read the ?q= param to pre-fill the search box
  const params = new URLSearchParams(location.search);
  const initialQuery = params.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);

  // On mount: load explore posts, trending tags, and run initial search if query exists
  useEffect(() => {
    dispatch(fetchExplore());
    dispatch(getTrending());
    if (initialQuery) {
      dispatch(searchPosts(initialQuery));
    }
  }, [dispatch, initialQuery]);

  /**
   * Runs a search and reveals the search results section.
   *
   * @param {React.FormEvent} e
   */
  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) {
      dispatch(clearSearch());
      setHasSearched(false);
      return;
    }
    dispatch(searchPosts(query));
    setHasSearched(true);
  };

  /**
   * Clears the current search and restores the default explore view.
   */
  const handleClear = () => {
    setQuery("");
    setHasSearched(false);
    dispatch(clearSearch());
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-6xl mx-auto pt-16 px-4">
        <div className="flex gap-6 py-6">
          <Sidebar />

          <main className="flex-1 min-w-0 flex flex-col gap-5">
            {/* ── Search bar ────────────────────────────────────────────── */}
            <form onSubmit={handleSearch}>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search posts, people, hashtags…"
                  className="w-full pl-11 pr-24 py-3 border border-[#e5e5e5] dark:border-gray-700
                             rounded-[12px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                             placeholder-gray-400 dark:placeholder-gray-500
                             focus:outline-none focus:border-[#534AB7] text-sm transition"
                  data-testid="explore-search-input"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  {hasSearched && (
                    <button type="button" onClick={handleClear}
                      className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1 text-xs">
                      Clear
                    </button>
                  )}
                  <button type="submit" className="btn-primary text-xs px-4 py-1.5">
                    Search
                  </button>
                </div>
              </div>
            </form>

            {/* ── Search results (shown when a search is active) ──────── */}
            {hasSearched && (
              <div className="flex flex-col gap-4">
                <h2 className="font-bold text-gray-700 dark:text-gray-300">
                  Results for <span className="text-[#534AB7]">"{query}"</span>
                </h2>
                {searchResults.length === 0 ? (
                  <div className="card p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                    No results found. Try a different keyword.
                  </div>
                ) : (
                  searchResults.map((post) => <PostCard key={post._id} post={post} />)
                )}
              </div>
            )}

            {/* ── Default explore view (hidden during search) ─────────── */}
            {!hasSearched && (
              <>
                {/* Trending hashtags grid */}
                <section>
                  <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-3">Trending Hashtags</h2>
                  {trending.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500">No trending hashtags yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {trending.map(({ tag, count }) => (
                        <button
                          key={tag}
                          onClick={() => { setQuery(tag); dispatch(searchPosts(tag)); setHasSearched(true); }}
                          className="card p-4 text-left hover:border-[#534AB7] transition-colors group"
                        >
                          <p className="text-[#534AB7] font-bold group-hover:underline text-sm">{tag}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{count} {count === 1 ? "post" : "posts"}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                {/* Recent public posts */}
                <section>
                  <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-3">Recent Posts</h2>
                  <div className="flex flex-col gap-4">
                    {explore.slice(0, 10).map((post) => (
                      <PostCard key={post._id} post={post} />
                    ))}
                  </div>
                </section>
              </>
            )}
          </main>

          {/* ── Right sidebar ──────────────────────────────────────────── */}
          <aside className="w-72 shrink-0 hidden xl:flex flex-col gap-4">
            <SuggestWidget />

            {/* Nearby posts (first 5 from explore) */}
            {!hasSearched && explore.length > 0 && (
              <div className="card p-4">
                <h3 className="font-bold text-sm mb-3 text-gray-800 dark:text-gray-100">Nearby Posts</h3>
                <div className="flex flex-col gap-3">
                  {explore
                    .filter((p) => p.location?.name)
                    .slice(0, 5)
                    .map((post) => (
                      <div key={post._id} className="flex gap-2 items-start">
                        <div className="w-7 h-7 rounded-full bg-[#534AB7] flex items-center
                                        justify-center text-white text-xs font-bold shrink-0">
                          {post.author?.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate dark:text-white">{post.author?.name}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{post.text}</p>
                          <p className="text-[10px] text-[#534AB7] truncate">
                            📍 {post.location.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  {explore.filter((p) => p.location?.name).length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">No location-tagged posts yet.</p>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
