/**
 * controllers/authController.js — Handlers for authentication routes
 *
 * Exports:
 *   register — create a new user account
 *   login    — authenticate and issue a JWT cookie
 *   logout   — clear the JWT cookie
 *   getMe    — return the currently authenticated user's profile
 */

const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Signs a JWT containing the user's ID and sets it as an httpOnly cookie.
 *
 * @param {import('express').Response} res — Express response object
 * @param {string} userId — MongoDB ObjectId of the authenticated user
 */
const sendTokenCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    httpOnly: true, // not accessible via JS — protects against XSS
    // COOKIE_SECURE=true only when actually serving over HTTPS.
    // Never derive this from NODE_ENV alone — the app can be production
    // but still running on HTTP (e.g. local Docker, Render free tier behind proxy).
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax", // "lax" allows the cookie in same-site cross-port requests
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Creates a new user account, hashes the password (via model hook),
 * and returns the new user with a JWT cookie set.
 *
 * @param {import('express').Request}  req — body: { name, username, email, password }
 * @param {import('express').Response} res
 */
const register = async (req, res) => {
  // Check express-validator results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, username, email, password } = req.body;

  try {
    // Check for duplicate email or username
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? "email" : "username";
      return res.status(409).json({ message: `An account with that ${field} already exists` });
    }

    // Create the user — password is hashed by the pre-save hook in User.js
    const user = await User.create({ name, username, email, password });

    // Issue JWT cookie
    sendTokenCookie(res, user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      followers: user.followers,
      following: user.following,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
};

/**
 * POST /api/auth/login
 * Validates credentials, issues a JWT cookie on success.
 *
 * @param {import('express').Request}  req — body: { email, password }
 * @param {import('express').Response} res
 */
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Explicitly select password because the schema sets select:false
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Use the model's comparePassword instance method (uses bcrypt internally)
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    sendTokenCookie(res, user._id);

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      followers: user.followers,
      following: user.following,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};

/**
 * POST /api/auth/logout
 * Clears the JWT cookie, effectively logging the user out.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const logout = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0), // immediately expire the cookie
  });
  res.json({ message: "Logged out successfully" });
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 * Requires the `protect` middleware to run first (attaches req.user).
 *
 * @param {import('express').Request}  req — req.user set by authMiddleware
 * @param {import('express').Response} res
 */
const getMe = async (req, res) => {
  try {
    // req.user is already populated by the protect middleware
    res.json(req.user);
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { register, login, logout, getMe };
