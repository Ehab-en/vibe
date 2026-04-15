/**
 * middleware/authMiddleware.js — JWT authentication middleware
 *
 * Reads the JWT from the httpOnly cookie named "token",
 * verifies it, and attaches the decoded user payload to req.user.
 * If the token is missing or invalid the request is rejected with 401.
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Protects a route by requiring a valid JWT cookie.
 *
 * Usage: add `protect` as middleware before any route handler that
 * should only be accessible to authenticated users.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const protect = async (req, res, next) => {
  try {
    // Read JWT from the httpOnly cookie set at login
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated — no token provided" });
    }

    // Verify signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data (excluding password) to ensure the account still exists
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    // Attach user to the request object so downstream handlers can read it
    req.user = user;
    next();
  } catch (err) {
    // jwt.verify throws on invalid/expired tokens
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { protect };
