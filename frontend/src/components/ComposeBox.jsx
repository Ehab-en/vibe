/**
 * components/ComposeBox.jsx — Quick-post composer card shown on the Home feed
 *
 * Features:
 *  - Textarea with 280-character limit and live counter
 *  - Character counter turns red when approaching/exceeding limit
 *  - Optional image URL input
 *  - Location detection via browser Geolocation API
 *  - Dispatches createPost to Redux on submit
 *
 * Props: none (reads user from Redux store)
 */

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createPost } from "../store/postsSlice";

const MAX_CHARS = 280;

const ComposeBox = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [location, setLocation] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const remaining = MAX_CHARS - text.length;
  const isOverLimit = remaining < 0;

  /**
   * Uses the browser Geolocation API to fetch the user's current coordinates.
   * Reverse-geocodes the coordinates into a place name using the open
   * Nominatim API (no API key required).
   */
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          // Reverse-geocode using the open Nominatim API
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const geoData = await res.json();
          const name =
            geoData.address?.city ||
            geoData.address?.town ||
            geoData.address?.village ||
            geoData.display_name ||
            "Unknown location";

          setLocation({ name, lat, lng });
        } catch {
          setLocation({ name: "Current location", lat, lng });
        } finally {
          setLocLoading(false);
        }
      },
      () => {
        setError("Unable to retrieve your location");
        setLocLoading(false);
      }
    );
  };

  /**
   * Dispatches the createPost thunk with the current form state.
   * Resets the form fields on success.
   *
   * @param {React.FormEvent} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || isOverLimit) return;
    setError("");
    setSubmitting(true);

    const result = await dispatch(
      createPost({ text, image: image || "", location: location || {} })
    );

    if (!result.error) {
      setText("");
      setImage("");
      setLocation(null);
    } else {
      setError("Failed to post. Please try again.");
    }

    setSubmitting(false);
  };

  return (
    <div className="card p-4" data-testid="compose-box">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* ── Top row: avatar + textarea ──────────────────────────────────── */}
        <div className="flex gap-3">
          {/* Current user avatar */}
          <div className="shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border border-[#e5e5e5]"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#534AB7] flex items-center
                              justify-center text-white font-bold text-sm">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Text area */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            className="flex-1 resize-none border-0 outline-none text-sm leading-relaxed
                       placeholder-gray-400 bg-transparent dark:text-gray-100 dark:placeholder-gray-500"
            data-testid="compose-textarea"
          />
        </div>

        {/* ── Image URL input (optional) ──────────────────────────────────── */}
        <input
          type="url"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="Image URL (optional)"
          className="input text-xs"
          data-testid="compose-image-input"
        />

        {/* ── Location tag ────────────────────────────────────────────────── */}
        {location && (
          <div className="flex items-center gap-1 text-xs text-[#534AB7]">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {location.name}
            <button
              type="button"
              onClick={() => setLocation(null)}
              className="ml-1 text-gray-400 hover:text-red-400"
            >
              ×
            </button>
          </div>
        )}

        {/* ── Error message ────────────────────────────────────────────────── */}
        {error && <p className="text-red-500 text-xs">{error}</p>}

        {/* ── Footer: tools + counter + submit ────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 border-t border-[#e5e5e5] dark:border-gray-700">
          {/* Location button */}
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={locLoading}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#534AB7]
                       transition-colors disabled:opacity-50"
            data-testid="location-button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {locLoading ? "Detecting…" : "Add location"}
          </button>

          <div className="flex items-center gap-3">
            {/* Character counter — turns orange below 20, red when over limit */}
            <span
              className={`text-xs font-medium ${
                isOverLimit
                  ? "text-red-500"
                  : remaining <= 20
                  ? "text-orange-400"
                  : "text-gray-400"
              }`}
              data-testid="char-counter"
            >
              {remaining}
            </span>

            {/* Submit button */}
            <button
              type="submit"
              disabled={!text.trim() || isOverLimit || submitting}
              className="btn-primary text-sm px-5 py-1.5"
              data-testid="compose-submit"
            >
              {submitting ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ComposeBox;
