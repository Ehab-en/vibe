/**
 * pages/ProfilePage.jsx — User profile page
 *
 * Shows:
 *  - Cover photo area + avatar (with camera-icon upload overlay on own profile)
 *  - Name, username, bio, location
 *  - Stats: posts / followers / following / total likes received
 *  - Follow / Unfollow button (hidden on own profile)
 *  - Tabs: Posts | Media | Liked
 *
 * Route param: :username
 */

import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { fetchUserPosts } from "../store/postsSlice";
import { updateUser } from "../store/authSlice";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import PostCard from "../components/PostCard";

const ProfilePage = () => {
  const { username } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { userPosts } = useSelector((state) => state.posts);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef(null);

  /** Loads the profile and posts for the requested username */
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`/api/users/${username}`);
        setProfile(data);
        dispatch(fetchUserPosts(data._id));
        setIsFollowing(
          data.followers?.some((f) => (f._id || f) === currentUser?._id)
        );
      } catch {
        navigate("/home");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [username, dispatch, navigate, currentUser]);

  /**
   * Toggles follow / unfollow. Updates local profile state optimistically.
   */
  const handleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      const { data } = await axios.post(`/api/users/${profile._id}/follow`);
      setIsFollowing(data.following);
      setProfile((prev) => ({
        ...prev,
        followers: data.following
          ? [...(prev.followers || []), { _id: currentUser._id }]
          : (prev.followers || []).filter((f) => (f._id || f) !== currentUser._id),
      }));
    } catch {
      // silently fail
    } finally {
      setFollowLoading(false);
    }
  };

  /**
   * Opens the hidden <input type="file"> when the camera icon is clicked.
   */
  const handleAvatarClick = () => {
    setAvatarError("");
    fileInputRef.current?.click();
  };

  /**
   * Handles a new file selection:
   *  1. Validates the file is an image and under 5 MB
   *  2. Sends a multipart PUT to /api/users/avatar
   *  3. Updates the Redux auth store so the Navbar avatar refreshes
   *  4. Updates local profile state so the avatar refreshes inline
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!file.type.startsWith("image/")) {
      setAvatarError("Only image files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be under 5 MB");
      return;
    }

    setAvatarUploading(true);
    setAvatarError("");

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const { data } = await axios.put("/api/users/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Refresh the avatar in the Redux store (updates Navbar + all avatars)
      dispatch(updateUser({ avatar: data.avatar }));

      // Refresh local profile state so this page updates instantly
      setProfile((prev) => ({ ...prev, avatar: data.avatar }));
    } catch (err) {
      setAvatarError(err.response?.data?.message || "Upload failed");
    } finally {
      setAvatarUploading(false);
      // Reset the file input so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /** Total likes received across all posts */
  const totalLikes = userPosts.reduce((sum, p) => sum + (p.likesCount || 0), 0);

  /** Posts with at least one image (Media tab) */
  const mediaPosts = userPosts.filter((p) => p.image);

  const isOwnProfile = currentUser?.username === username;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-6xl mx-auto pt-20 px-4">
          <div className="card animate-pulse h-64" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-6xl mx-auto pt-16 px-4">
        <div className="flex gap-6 py-6">
          <Sidebar />

          <main className="flex-1 min-w-0 flex flex-col gap-4">
            {/* ── Profile card ──────────────────────────────────────────────── */}
            <div className="card overflow-hidden">
              {/* Cover photo */}
              <div
                className="h-36 w-full"
                style={{ background: "linear-gradient(135deg, #534AB7 0%, #A9A5E5 100%)" }}
              />

              <div className="px-6 pb-4">
                <div className="flex items-end justify-between -mt-10 mb-3">
                  {/* ── Avatar with upload overlay (own profile only) ──────── */}
                  <div className="relative group border-4 border-white dark:border-gray-800 rounded-full">
                    {/* Hidden file input — triggered by clicking the overlay */}
                    {isOwnProfile && (
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        data-testid="avatar-file-input"
                      />
                    )}

                    {/* Avatar image or initial letter */}
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-[#534AB7] flex items-center
                                      justify-center text-white text-2xl font-bold">
                        {profile.name?.[0]?.toUpperCase()}
                      </div>
                    )}

                    {/* Camera icon overlay — visible on hover (own profile only) */}
                    {isOwnProfile && (
                      <button
                        onClick={handleAvatarClick}
                        disabled={avatarUploading}
                        className="absolute inset-0 rounded-full bg-black/40 flex items-center
                                   justify-center opacity-0 group-hover:opacity-100 transition-opacity
                                   disabled:cursor-wait"
                        aria-label="Change profile photo"
                        data-testid="avatar-upload-btn"
                      >
                        {avatarUploading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent
                                          rounded-full animate-spin" />
                        ) : (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0
                                 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0
                                 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0
                                 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Follow / Edit button */}
                  {isOwnProfile ? (
                    <button className="btn-outline text-sm">Edit Profile</button>
                  ) : (
                    <button
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={isFollowing ? "btn-outline text-sm" : "btn-primary text-sm"}
                    >
                      {followLoading ? "…" : isFollowing ? "Following" : "Follow"}
                    </button>
                  )}
                </div>

                {/* Avatar upload error */}
                {avatarError && (
                  <p className="text-red-500 text-xs mb-2">{avatarError}</p>
                )}

                {/* Name + bio + location */}
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">@{profile.username}</p>
                {profile.bio && <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">{profile.bio}</p>}
                {profile.location && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243
                           a8 8 0 1111.314 0z" />
                    </svg>
                    {profile.location}
                  </p>
                )}

                {/* Stats row */}
                <div className="flex gap-6 mt-4 pt-4 border-t border-[#e5e5e5] dark:border-gray-700">
                  {[
                    { label: "Posts",     value: userPosts.length },
                    { label: "Followers", value: profile.followers?.length || 0 },
                    { label: "Following", value: profile.following?.length || 0 },
                    { label: "Likes",     value: totalLikes },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <p className="font-bold text-gray-900 dark:text-white">{value}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Tabs ──────────────────────────────────────────────────────── */}
            <div className="card">
              <div className="flex border-b border-[#e5e5e5] dark:border-gray-700">
                {["posts", "media", "liked"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors
                      ${activeTab === t
                        ? "text-[#534AB7] border-b-2 border-[#534AB7]"
                        : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Tab content ───────────────────────────────────────────────── */}
            <div className="flex flex-col gap-4">
              {activeTab === "posts" && (
                <>
                  {userPosts.length === 0 ? (
                    <div className="card p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                      No posts yet.
                    </div>
                  ) : (
                    userPosts.map((post) => <PostCard key={post._id} post={post} />)
                  )}
                </>
              )}

              {activeTab === "media" && (
                <div className="grid grid-cols-3 gap-2">
                  {mediaPosts.length === 0 ? (
                    <p className="col-span-3 text-center text-gray-400 dark:text-gray-500 text-sm py-10">
                      No media posts yet.
                    </p>
                  ) : (
                    mediaPosts.map((post) => (
                      <img
                        key={post._id}
                        src={post.image}
                        alt=""
                        className="w-full aspect-square object-cover rounded-[8px]
                                   border border-[#e5e5e5] dark:border-gray-700"
                      />
                    ))
                  )}
                </div>
              )}

              {activeTab === "liked" && (
                <div className="card p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                  Liked posts coming soon.
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
