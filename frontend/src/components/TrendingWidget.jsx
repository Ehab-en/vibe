/**
 * components/TrendingWidget.jsx — Right sidebar widget showing trending hashtags
 *
 * Fetches the top 10 hashtags from the past 7 days via Redux.
 * Clicking a hashtag navigates to the Explore page with a pre-filled search.
 *
 * Props: none (reads from Redux store)
 */

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getTrending } from "../store/postsSlice";

const TrendingWidget = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Guard: ensure trending is always an array even if the store is in a bad state
  const rawTrending = useSelector((state) => state.posts.trending);
  const trending = Array.isArray(rawTrending) ? rawTrending : [];

  // Fetch trending hashtags once when the widget mounts
  useEffect(() => {
    dispatch(getTrending());
  }, [dispatch]);

  /**
   * Navigates to the Explore page with the hashtag as a search query.
   *
   * @param {string} tag — hashtag including the # symbol
   */
  const handleTagClick = (tag) => {
    navigate(`/explore?q=${encodeURIComponent(tag)}`);
  };

  return (
    <div className="card p-4" data-testid="trending-widget">
      <h3 className="font-bold text-sm mb-3 text-gray-800 dark:text-gray-100">Trending</h3>

      {trending.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">No trending hashtags yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {trending.map(({ tag, count }, idx) => (
            <li key={tag}>
              <button
                onClick={() => handleTagClick(tag)}
                className="w-full text-left group"
              >
                <p className="text-[10px] text-gray-400 dark:text-gray-500">#{idx + 1} Trending</p>
                <p className="text-sm font-semibold text-[#534AB7] group-hover:underline dark:text-primary-300">
                  {tag}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{count} {count === 1 ? "post" : "posts"}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TrendingWidget;
