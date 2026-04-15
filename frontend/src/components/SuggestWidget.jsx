/**
 * components/SuggestWidget.jsx — "Who to Follow" right sidebar widget
 *
 * Fetches user suggestions from the server (users the current user doesn't
 * follow yet) and lets the user follow them directly from the widget.
 *
 * Props: none (reads from Redux store)
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";

const SuggestWidget = () => {
  const { user } = useSelector((state) => state.auth);
  const [suggestions, setSuggestions] = useState([]);
  const [followedIds, setFollowedIds] = useState(new Set());

  /** Fetch suggestions once on mount */
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get("/api/users/suggestions", { withCredentials: true });
        // Guard: default to [] if the API returns something other than an array
        setSuggestions(Array.isArray(data) ? data : []);
      } catch {
        // silently fail — widget is non-critical
      }
    };
    load();
  }, []);

  /**
   * Toggles the follow status for a suggested user.
   * Updates local state immediately for a responsive UI.
   *
   * @param {string} userId — MongoDB ID of the suggested user
   */
  const handleFollow = async (userId) => {
    try {
      await axios.post(`/api/users/${userId}/follow`, {}, { withCredentials: true });
      setFollowedIds((prev) => {
        const next = new Set(prev);
        if (next.has(userId)) {
          next.delete(userId);
        } else {
          next.add(userId);
        }
        return next;
      });
    } catch {
      // silently fail
    }
  };

  // Component-level fallback so .map() never runs on a non-array
  const safeSuggestions = Array.isArray(suggestions) ? suggestions : [];

  if (!safeSuggestions.length) return null;

  return (
    <div className="card p-4" data-testid="suggest-widget">
      <h3 className="font-bold text-sm mb-3 text-gray-800 dark:text-gray-100">Who to Follow</h3>

      <ul className="flex flex-col gap-3">
        {safeSuggestions.map((suggestion) => {
          const isFollowing = followedIds.has(suggestion._id);

          return (
            <li key={suggestion._id} className="flex items-center gap-2">
              {/* Avatar */}
              <Link to={`/profile/${suggestion.username}`}>
                {suggestion.avatar ? (
                  <img
                    src={suggestion.avatar}
                    alt={suggestion.name}
                    className="w-8 h-8 rounded-full object-cover border border-[#e5e5e5]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#534AB7] flex items-center
                                  justify-center text-white text-xs font-bold">
                    {suggestion.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </Link>

              {/* Name + username */}
              <div className="flex-1 min-w-0">
                <Link
                  to={`/profile/${suggestion.username}`}
                  className="text-xs font-semibold truncate block hover:underline dark:text-gray-200"
                >
                  {suggestion.name}
                </Link>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                  @{suggestion.username} · {suggestion.followers?.length || 0} followers
                </p>
              </div>

              {/* Follow / Unfollow button */}
              <button
                onClick={() => handleFollow(suggestion._id)}
                className={`shrink-0 text-xs px-3 py-1 rounded-full font-semibold transition-colors
                  ${isFollowing
                    ? "border border-[#534AB7] text-[#534AB7] hover:bg-[#EEEDF9]"
                    : "bg-[#534AB7] text-white hover:bg-[#3D3589]"
                  }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SuggestWidget;
