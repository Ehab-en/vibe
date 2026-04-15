/**
 * pages/LandingPage.jsx — Public landing page with login / register tabs
 *
 * Layout: split screen
 *   Left panel  — purple brand panel with a mock feed preview
 *   Right panel — white panel with Login / Register tabs
 *
 * Redirects to /home automatically if the user is already authenticated.
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, registerUser, clearError } from "../store/authSlice";

// ─── Mock feed cards shown on the left panel ─────────────────────────────────
const MOCK_POSTS = [
  { id: 1, name: "Alex Chen", handle: "alexchen", text: "Just shipped a new feature! 🚀 #coding #vibe", time: "2m" },
  { id: 2, name: "Maya Patel", handle: "mayapatel", text: "Beautiful sunset today 🌅 #photography", time: "15m" },
  { id: 3, name: "Jordan Lee", handle: "jordanlee", text: "Working on something exciting… stay tuned! #buildinpublic", time: "1h" },
];

const LandingPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((state) => state.auth);

  // Which tab is active: "login" or "register"
  const [tab, setTab] = useState("login");

  // Controlled form fields
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });

  // Redirect to home if already logged in
  useEffect(() => {
    if (user) navigate("/home");
  }, [user, navigate]);

  /** Clears server errors when the user switches tabs */
  const handleTabSwitch = (newTab) => {
    setTab(newTab);
    dispatch(clearError());
    setForm({ name: "", username: "", email: "", password: "" });
  };

  /**
   * Handles form submission for both login and register.
   *
   * @param {React.FormEvent} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (tab === "login") {
      await dispatch(loginUser({ email: form.email, password: form.password }));
    } else {
      await dispatch(registerUser(form));
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — brand + mock feed preview ─────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12"
        style={{ background: "linear-gradient(135deg, #534AB7 0%, #3D3589 100%)" }}
      >
        {/* Brand */}
        <div>
          <h1 className="text-5xl font-bold text-white mb-3">Vibe</h1>
          <p className="text-purple-200 text-lg leading-relaxed max-w-md">
            Share your world. Connect with people who share your passion.
          </p>
        </div>

        {/* Mock feed cards */}
        <div className="flex flex-col gap-3 my-8">
          {MOCK_POSTS.map((post) => (
            <div
              key={post.id}
              className="bg-white/10 backdrop-blur-sm rounded-[12px] p-4 border border-white/20"
            >
              <div className="flex items-center gap-2 mb-2">
                {/* Mock avatar */}
                <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center
                                text-white text-xs font-bold">
                  {post.name[0]}
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">{post.name}</p>
                  <p className="text-purple-200 text-[10px]">@{post.handle} · {post.time}</p>
                </div>
              </div>
              <p className="text-white/90 text-sm">{post.text}</p>
              {/* Mock like bar */}
              <div className="flex gap-4 mt-2">
                <span className="text-purple-200 text-xs">♡ {Math.floor(Math.random() * 50 + 1)}</span>
                <span className="text-purple-200 text-xs">💬 {Math.floor(Math.random() * 10)}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-purple-300 text-xs">© 2026 Vibe · Share your world</p>
      </div>

      {/* ── Right panel — auth forms ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
        {/* Mobile brand (visible only on small screens) */}
        <h1 className="lg:hidden text-4xl font-bold text-[#534AB7] mb-8">Vibe</h1>

        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {tab === "login" ? "Welcome back" : "Join Vibe"}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {tab === "login"
              ? "Sign in to continue to your feed"
              : "Create your account and start sharing"}
          </p>

          {/* Tab switcher */}
          <div className="flex border border-[#e5e5e5] rounded-[12px] p-1 mb-6" data-testid="tab-switcher">
            <button
              onClick={() => handleTabSwitch("login")}
              className={`flex-1 py-2 rounded-[8px] text-sm font-semibold transition-colors
                ${tab === "login" ? "bg-[#534AB7] text-white" : "text-gray-500 hover:text-gray-700"}`}
              data-testid="login-tab"
            >
              Sign In
            </button>
            <button
              onClick={() => handleTabSwitch("register")}
              className={`flex-1 py-2 rounded-[8px] text-sm font-semibold transition-colors
                ${tab === "register" ? "bg-[#534AB7] text-white" : "text-gray-500 hover:text-gray-700"}`}
              data-testid="register-tab"
            >
              Register
            </button>
          </div>

          {/* Auth form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" data-testid="auth-form">
            {/* Register-only fields */}
            {tab === "register" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input"
                    placeholder="Your name"
                    required
                    data-testid="register-name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
                    className="input"
                    placeholder="@username"
                    required
                    data-testid="register-username"
                  />
                </div>
              </>
            )}

            {/* Shared fields */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
                placeholder="you@example.com"
                required
                data-testid="email-input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input"
                placeholder="••••••••"
                required
                data-testid="password-input"
              />
            </div>

            {/* Server error */}
            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary py-3 text-base mt-1"
              data-testid="auth-submit"
            >
              {loading
                ? "Please wait…"
                : tab === "login"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          {/* Tab hint */}
          <p className="text-center text-sm text-gray-500 mt-4">
            {tab === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => handleTabSwitch("register")}
                  className="text-[#534AB7] font-semibold hover:underline"
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => handleTabSwitch("login")}
                  className="text-[#534AB7] font-semibold hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
