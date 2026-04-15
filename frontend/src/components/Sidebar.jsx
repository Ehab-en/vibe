/**
 * components/Sidebar.jsx — Left navigation sidebar
 *
 * Displays four nav items: Home, Explore, Notifications, Profile.
 * Active link is highlighted with the primary purple color.
 * Shows the unread notification count badge.
 *
 * Props: none (reads from Redux store)
 */

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../store/authSlice";

const Sidebar = () => {
  const { user } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notifications);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /** Logs out and redirects to the landing page. */
  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/");
  };

  /** Nav items configuration — label, icon path, route */
  const navItems = [
    {
      label: "Home",
      to: "/home",
      testId: "sidebar-home",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: "Explore",
      to: "/explore",
      testId: "sidebar-explore",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      label: "Notifications",
      to: "/notifications",
      testId: "sidebar-notifications",
      badge: unreadCount,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      label: "Profile",
      to: user ? `/profile/${user.username}` : "/",
      testId: "sidebar-profile",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-56 shrink-0">
      {/* Sticky so the sidebar stays visible when the feed scrolls */}
      <div className="sticky top-16 pt-4 flex flex-col gap-1">
        {navItems.map(({ label, to, testId, icon, badge }) => (
          <NavLink
            key={label}
            to={to}
            data-testid={testId}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-[12px] font-medium text-sm transition-colors
              ${isActive
                ? "bg-[#EEEDF9] text-[#534AB7] dark:bg-gray-700 dark:text-primary-300"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`
            }
          >
            <span className="relative">
              {icon}
              {/* Unread badge (shown only on Notifications item) */}
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full
                                 text-white text-[9px] flex items-center justify-center font-bold">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </span>
            {label}
          </NavLink>
        ))}

        {/* Create Post button */}
        <NavLink
          to="/create"
          data-testid="sidebar-create"
          className="mt-3 btn-primary text-center text-sm py-2.5 rounded-[12px] flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Post
        </NavLink>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-2 flex items-center gap-3 px-4 py-2.5 rounded-[12px] text-sm text-red-500
                     hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
          data-testid="sidebar-logout"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
