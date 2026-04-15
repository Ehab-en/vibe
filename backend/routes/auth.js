/**
 * routes/auth.js — Authentication routes
 *
 * POST /api/auth/register — create account
 * POST /api/auth/login    — sign in
 * POST /api/auth/logout   — sign out
 * GET  /api/auth/me       — get current user (protected)
 */

const express = require("express");
const { body } = require("express-validator");
const { register, login, logout, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ─── Validation rules ─────────────────────────────────────────────────────────

/** Shared validators for the register endpoint */
const registerValidators = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .matches(/^[a-z0-9_]+$/i)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

/** Validators for the login endpoint */
const loginValidators = [
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

router.post("/register", registerValidators, register);
router.post("/login", loginValidators, login);
router.post("/logout", logout);
router.get("/me", protect, getMe);

module.exports = router;
