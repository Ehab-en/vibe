/**
 * components/PostCard.jsx — Renders a single post in the feed or grid
 *
 * Features:
 *  - Author avatar, name, username, timestamp
 *  - Post text (with hashtag highlighting)
 *  - Optional attached image
 *  - Optional location tag
 *  - Like button (toggle) with animated counter
 *  - Comment count + inline comment form
 *  - Delete button visible only to the post author
 *
 * Props:
 *   post {object}  — the post document from the API
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { likePost, commentPost, deletePost } from "../store/postsSlice";

/**
 * Formats a date string into a human-friendly relative time label.
 * e.g. "just now", "5m", "3h", "Apr 12"
 *
 * @param {string} dateStr — ISO date string
 * @returns {string}
 */
const formatDate = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr)) / 1000; // seconds ago
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/**
 * Converts #hashtag occurrences in text into styled purple spans.
 *
 * @param {string} text — raw post text
 * @returns {React.ReactNode[]}
 */
const renderTextWithHashtags = (text) => {
  const parts = text.split(/(#[a-zA-Z0-9_]+)/g);
  return parts.map((part, i) =>
    part.startsWith("#") ? (
      <span key={i} className="text-[#534AB7] font-medium cursor-pointer hover:underline">
        {part}
      </span>
    ) : (
      part
    )
  );
};

const PostCard = ({ post }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Determine if the current user has liked this post
  const isLiked = post.likes?.some(
    (id) => id === user?._id || id?._id === user?._id
  );

  /**
   * Dispatches the likePost thunk and optimistically toggles the heart.
   */
  const handleLike = () => {
    if (!user) return;
    dispatch(likePost(post._id));
  };

  /**
   * Submits a new comment on this post.
   * Clears the input on success.
   */
  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    await dispatch(commentPost({ postId: post._id, text: commentText }));
    setCommentText("");
    setSubmitting(false);
  };

  /**
   * Deletes the post after a browser confirmation prompt.
   */
  const handleDelete = () => {
    if (window.confirm("Delete this post?")) {
      dispatch(deletePost(post._id));
    }
  };

  const isAuthor = user?._id === (post.author?._id || post.author);

  return (
    <article className="card p-4 flex flex-col gap-3 dark:text-gray-100" data-testid="post-card">
      {/* ── Header: avatar + author info + delete ──────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <Link to={`/profile/${post.author?.username}`}>
            {post.author?.avatar ? (
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-10 h-10 rounded-full object-cover border border-[#e5e5e5]"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#534AB7] flex items-center justify-center
                              text-white font-bold text-sm">
                {post.author?.name?.[0]?.toUpperCase()}
              </div>
            )}
          </Link>

          {/* Name + username + timestamp */}
          <div>
            <Link
              to={`/profile/${post.author?.username}`}
              className="font-semibold text-sm hover:underline"
            >
              {post.author?.name}
            </Link>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              @{post.author?.username} · {formatDate(post.createdAt)}
            </p>
          </div>
        </div>

        {/* Delete button (author only) */}
        {isAuthor && (
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            aria-label="Delete post"
            data-testid="delete-post-btn"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Post text ──────────────────────────────────────────────────────── */}
      <p className="text-sm leading-relaxed">{renderTextWithHashtags(post.text)}</p>

      {/* ── Attached image ─────────────────────────────────────────────────── */}
      {/* Only render when post.image is a non-empty string (guards against "" or null) */}
      {post.image && typeof post.image === "string" && post.image.trim().length > 0 && (
        <img
          src={post.image}
          alt="Post image"
          className="rounded-[8px] max-h-80 object-cover w-full border border-[#e5e5e5]"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      )}

      {/* ── Location tag ───────────────────────────────────────────────────── */}
      {post.location?.name && (
        <span className="inline-flex items-center gap-1 text-xs text-[#534AB7] dark:text-primary-300
                         bg-[#EEEDF9] dark:bg-gray-700 px-2 py-0.5 rounded-full w-fit">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {post.location.name}
        </span>
      )}

      {/* ── Action bar: like + comment ──────────────────────────────────────── */}
      <div className="flex items-center gap-5 pt-1 border-t border-[#e5e5e5] dark:border-gray-700">
        {/* Like button */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm transition-colors group
            ${isLiked ? "text-[#534AB7]" : "text-gray-400 hover:text-[#534AB7]"}`}
          data-testid="like-button"
          aria-label={isLiked ? "Unlike post" : "Like post"}
        >
          <svg
            className={`w-5 h-5 transition-transform group-active:scale-125
              ${isLiked ? "fill-[#534AB7]" : "fill-none"}`}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{post.likesCount || 0}</span>
        </button>

        {/* Comment toggle button */}
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#534AB7] transition-colors"
          data-testid="comment-button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{post.comments?.length || 0}</span>
        </button>
      </div>

      {/* ── Comments section (toggled) ──────────────────────────────────────── */}
      {showComments && (
        <div className="flex flex-col gap-3 pt-2">
          {/* Existing comments */}
          {post.comments?.map((c) => (
            <div key={c._id} className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center
                              text-xs font-bold text-gray-500 dark:text-gray-300 shrink-0">
                {c.user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-[8px] px-3 py-1.5 flex-1">
                <span className="text-xs font-semibold dark:text-gray-200">{c.user?.name} </span>
                <span className="text-xs text-gray-600 dark:text-gray-300">{c.text}</span>
              </div>
            </div>
          ))}

          {/* New comment form */}
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment…"
              className="input flex-1 text-xs py-1.5"
              data-testid="comment-input"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || submitting}
              className="btn-primary text-xs px-3 py-1.5"
              data-testid="comment-submit"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </article>
  );
};

export default PostCard;
