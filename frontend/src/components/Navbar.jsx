/**
 * components/Navbar.jsx — Top navigation bar
 *
 * Shows the Vibe brand logo, a search bar, dark mode toggle, and the user's
 * avatar with a logout dropdown. Renders nothing special if not logged in.
 *
 * Props: none (reads from Redux store)
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../store/authSlice";
import { searchPosts } from "../store/postsSlice";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notifications);

  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("vibeTheme") === "dark"
  );

  /**
   * Toggles dark mode: flips the `dark` class on <html> and persists to localStorage.
   */
  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("vibeTheme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("vibeTheme", "light");
    }
  };

  /**
   * Handles the search form submission.
   *
   * @param {React.FormEvent} e
   */
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    dispatch(searchPosts(searchQuery));
    navigate(`/explore?q=${encodeURIComponent(searchQuery)}`);
    setSearchQuery("");
  };

  /**
   * Logs the user out and redirects to the landing page.
   */
  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#e5e5e5] h-14
                    dark:bg-gray-900 dark:border-gray-700">
      <div className="max-w-6xl mx-auto h-full px-4 flex items-center justify-between gap-4">
        {/* ── Brand logo ────────────────────────────────────────────────────── */}
        <Link
          to={user ? "/home" : "/"}
          className="text-2xl font-bold text-[#534AB7] shrink-0"
          data-testid="brand-logo"
        >
          Vibe
        </Link>

        {/* ── Search bar (only shown when logged in) ────────────────────────── */}
        {user && (
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-md"
            data-testid="search-form"
          >
            <div className="relative">
              {/* Search icon */}
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Vibe..."
                className="w-full pl-9 pr-4 py-1.5 bg-gray-100 border border-[#e5e5e5] rounded-full
                           text-sm focus:outline-none focus:border-[#534AB7] focus:bg-white transition
                           dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100
                           dark:placeholder-gray-400 dark:focus:bg-gray-600"
              />
            </div>
          </form>
        )}

        <div className="flex items-center gap-3 shrink-0">
          {/* ── Dark mode toggle ──────────────────────────────────────────────── */}
          <button
            onClick={toggleDark}
            className="w-8 h-8 flex items-center justify-center rounded-full
                       text-gray-500 hover:bg-gray-100 transition-colors
                       dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            data-testid="dark-mode-toggle"
          >
            {isDark ? (
              /* Sun icon */
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343
                     17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707
                     M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              /* Moon icon */
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003
                     9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* ── User avatar + dropdown ────────────────────────────────────────── */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 focus:outline-none"
                aria-label="User menu"
              >
                {/* Avatar */}
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-[#e5e5e5]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#534AB7] flex items-center justify-center text-white text-sm font-bold">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium hidden sm:block dark:text-gray-100">
                  {user.name}
                </span>

                {/* Notification badge */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div
                  className="absolute right-0 top-10 w-48 bg-white border border-[#e5e5e5] rounded-[12px]
                             shadow-lg py-1 z-50
                             dark:bg-gray-800 dark:border-gray-700"
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <Link
                    to={`/profile/${user.username}`}
                    className="block px-4 py-2 text-sm hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setDropdownOpen(false)}
                    data-testid="nav-profile-link"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/notifications"
                    className="block px-4 py-2 text-sm hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setDropdownOpen(false)}
                    data-testid="nav-notifications-link"
                  >
                    Notifications {unreadCount > 0 && <span className="text-[#534AB7]">({unreadCount})</span>}
                  </Link>
                  <hr className="my-1 border-[#e5e5e5] dark:border-gray-700" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                    data-testid="logout-button"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
