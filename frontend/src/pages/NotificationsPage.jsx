/**
 * pages/NotificationsPage.jsx — Notifications list
 *
 * Shows all notifications for the authenticated user.
 * Unread notifications are highlighted with a purple left border.
 *
 * Actions:
 *  - Click a notification → marks it read and navigates to the relevant post
 *  - "Mark all read" button → clears the badge across the entire app
 *  - Delete button per notification
 */

import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNotifications,
  markRead,
  markAllRead,
  deleteNotification,
} from "../store/notificationsSlice";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

/**
 * Returns an emoji icon and color class for each notification type.
 *
 * @param {"like"|"comment"|"follow"} type
 * @returns {{ icon: string, color: string }}
 */
const getTypeStyle = (type) => {
  switch (type) {
    case "like":    return { icon: "♥", color: "text-red-500" };
    case "comment": return { icon: "💬", color: "text-blue-500" };
    case "follow":  return { icon: "👤", color: "text-[#534AB7]" };
    default:        return { icon: "🔔", color: "text-gray-500" };
  }
};

/**
 * Formats an ISO date string as a short relative time label.
 *
 * @param {string} dateStr
 * @returns {string}
 */
const formatDate = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const { items, loading, unreadCount } = useSelector((state) => state.notifications);

  // Fetch fresh notifications on mount
  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  /**
   * Marks a notification as read and, if it's linked to a post,
   * navigates the user to that post (handled by the wrapping <Link>).
   *
   * @param {string} notifId
   */
  const handleRead = (notifId) => {
    dispatch(markRead(notifId));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-6xl mx-auto pt-16 px-4">
        <div className="flex gap-6 py-6">
          <Sidebar />

          <main className="flex-1 min-w-0">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm font-normal text-[#534AB7]">
                    ({unreadCount} unread)
                  </span>
                )}
              </h1>

              {unreadCount > 0 && (
                <button
                  onClick={() => dispatch(markAllRead())}
                  className="btn-outline text-xs px-3 py-1.5"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* ── Loading state ─────────────────────────────────────────── */}
            {loading && items.length === 0 && (
              <div className="flex flex-col gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="card p-4 animate-pulse flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-2 bg-gray-200 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Empty state ───────────────────────────────────────────── */}
            {!loading && items.length === 0 && (
              <div className="card p-12 text-center">
                <p className="text-3xl mb-2">🔔</p>
                <p className="font-semibold text-gray-700">No notifications yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  When someone likes or comments on your posts, you'll see it here.
                </p>
              </div>
            )}

            {/* ── Notification list ────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              {items.map((notif) => {
                const { icon, color } = getTypeStyle(notif.type);

                return (
                  <div
                    key={notif._id}
                    className={`card flex items-start gap-3 p-4 transition-colors
                      ${!notif.isRead ? "border-l-4 border-l-[#534AB7] bg-[#EEEDF9]/30 dark:bg-primary-900/20" : ""}`}
                    data-testid="notification-item"
                  >
                    {/* Sender avatar */}
                    <Link to={`/profile/${notif.sender?.username}`} className="shrink-0">
                      {notif.sender?.avatar ? (
                        <img
                          src={notif.sender.avatar}
                          alt={notif.sender.name}
                          className="w-10 h-10 rounded-full object-cover border border-[#e5e5e5]"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#534AB7] flex items-center
                                        justify-center text-white font-bold text-sm">
                          {notif.sender?.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </Link>

                    {/* Message + meta */}
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => handleRead(notif._id)}
                    >
                      <p className="text-sm">
                        <span className={`mr-1 ${color}`}>{icon}</span>
                        <span className="font-semibold">{notif.sender?.name}</span>{" "}
                        <span className="text-gray-600">{notif.message.replace(notif.sender?.name || "", "").trim()}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(notif.createdAt)}</p>

                      {/* Linked post preview */}
                      {notif.post?.text && (
                        <p className="text-xs text-gray-500 mt-1 bg-gray-50 px-2 py-1 rounded-lg
                                       border border-[#e5e5e5] truncate">
                          "{notif.post.text}"
                        </p>
                      )}
                    </div>

                    {/* Unread dot + delete */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full bg-[#534AB7]" />
                      )}
                      <button
                        onClick={() => dispatch(deleteNotification(notif._id))}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                        aria-label="Delete notification"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
