/**
 * pages/CreatePostPage.jsx — Dedicated full-page post creation form
 *
 * Features:
 *  - Rich textarea with 280-character limit and live counter ring
 *  - Image file picker with local preview (sent as multipart/form-data)
 *  - Plain text location input (saves to post's location.name field)
 *  - Visibility toggle (public / followers only)
 *  - Builds FormData and dispatches createPost to Redux on submit
 *  - Navigates to /home on success
 */

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createPost } from "../store/postsSlice";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const MAX_CHARS = 280;

const CreatePostPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);      // File object
  const [imagePreview, setImagePreview] = useState("");  // local object URL for preview
  const [locationText, setLocationText] = useState("");  // plain text location
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const remaining = MAX_CHARS - text.length;
  const isOverLimit = remaining < 0;

  /** Circumference of the SVG ring character counter */
  const RADIUS = 18;
  const circumference = 2 * Math.PI * RADIUS;
  const progress = Math.min(text.length / MAX_CHARS, 1);
  const dashOffset = circumference * (1 - progress);

  /**
   * Handles a file selection from the picker:
   *  - validates type and size client-side
   *  - stores the File object for upload
   *  - creates a local object URL for the preview image
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10 MB");
      return;
    }

    setError("");
    setImageFile(file);
    // Revoke any previous preview URL to free memory
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
  };

  /** Clears the selected image and releases the preview object URL */
  const handleRemoveImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /**
   * Builds a FormData payload and dispatches the createPost thunk.
   * Using FormData ensures the image file is sent as multipart/form-data
   * so multer on the backend can handle it correctly.
   *
   * @param {React.FormEvent} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || isOverLimit) return;
    setError("");
    setSubmitting(true);

    // Build multipart form payload
    const formData = new FormData();
    formData.append("text", text);
    formData.append("isPublic", String(isPublic));
    if (imageFile) {
      // Field name must match upload.single("image") in routes/posts.js
      formData.append("image", imageFile);
    }
    if (locationText.trim()) {
      // Serialize the location object to JSON — FormData only supports strings
      formData.append("location", JSON.stringify({ name: locationText.trim() }));
    }

    const result = await dispatch(createPost(formData));

    if (!result.error) {
      // Clean up preview URL before leaving
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      navigate("/home");
    } else {
      setError("Failed to create post. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-6xl mx-auto pt-16 px-4">
        <div className="flex gap-6 py-6">
          <Sidebar />

          {/* ── Create post form card ────────────────────────────────────── */}
          <main className="flex-1 min-w-0">
            <div className="card p-6 max-w-2xl">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Create a Post</h1>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Author row */}
                <div className="flex items-center gap-3">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#e5e5e5] dark:border-gray-700" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#534AB7] flex items-center
                                    justify-center text-white font-bold">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold dark:text-white">{user?.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">@{user?.username}</p>
                  </div>
                </div>

                {/* Main text area */}
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="What's happening?"
                  rows={6}
                  className="w-full resize-none border border-[#e5e5e5] dark:border-gray-600 rounded-[12px]
                             p-3 text-sm leading-relaxed focus:outline-none focus:border-[#534AB7]
                             transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             placeholder-gray-400 dark:placeholder-gray-500"
                  data-testid="create-post-textarea"
                />

                {/* Character counter ring */}
                <div className="flex items-center justify-end gap-2">
                  <svg width="44" height="44" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r={RADIUS}
                      fill="none" stroke="#e5e5e5" strokeWidth="3" />
                    <circle cx="22" cy="22" r={RADIUS}
                      fill="none"
                      stroke={isOverLimit ? "#ef4444" : remaining <= 20 ? "#f97316" : "#534AB7"}
                      strokeWidth="3"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                      transform="rotate(-90 22 22)"
                      style={{ transition: "stroke-dashoffset 0.1s, stroke 0.2s" }}
                    />
                    <text x="22" y="27" textAnchor="middle"
                      fontSize="10" fill={isOverLimit ? "#ef4444" : "#6b7280"} fontWeight="600">
                      {remaining}
                    </text>
                  </svg>
                </div>

                {/* ── Image file picker ──────────────────────────────────── */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Attach image (optional)
                  </label>

                  {/* Hidden native file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    data-testid="image-file-input"
                  />

                  {!imagePreview ? (
                    /* Pick button — shown when no image is selected */
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 border border-dashed border-[#534AB7]
                                 text-[#534AB7] text-sm px-4 py-2 rounded-[8px] hover:bg-[#EEEDF9]
                                 dark:hover:bg-gray-700 transition-colors"
                      data-testid="image-pick-btn"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0
                             012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0
                             00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Choose image
                    </button>
                  ) : (
                    /* Preview + remove button — shown after a file is selected */
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="rounded-[8px] max-h-52 object-cover border border-[#e5e5e5] dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full
                                   w-6 h-6 flex items-center justify-center text-sm leading-none
                                   hover:bg-black/80"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{imageFile?.name}</p>
                    </div>
                  )}
                </div>

                {/* ── Location text input ────────────────────────────────── */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location (optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#534AB7] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <input
                      type="text"
                      value={locationText}
                      onChange={(e) => setLocationText(e.target.value)}
                      placeholder="e.g. Muscat, Oman"
                      className="input text-sm"
                      data-testid="location-text-input"
                    />
                  </div>
                </div>

                {/* Visibility toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-5 rounded-full transition-colors
                      ${isPublic ? "bg-[#534AB7]" : "bg-gray-300 dark:bg-gray-600"}`}>
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full
                                       shadow transition-transform
                                       ${isPublic ? "translate-x-5" : "translate-x-0"}`} />
                    </div>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {isPublic ? "Public post" : "Followers only"}
                  </span>
                </label>

                {/* Error */}
                {error && (
                  <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                {/* Submit */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/home")}
                    className="btn-outline text-sm px-6"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!text.trim() || isOverLimit || submitting}
                    className="btn-primary text-sm px-6"
                    data-testid="create-post-submit"
                  >
                    {submitting ? "Posting…" : "Post"}
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default CreatePostPage;
