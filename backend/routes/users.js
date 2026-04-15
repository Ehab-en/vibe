/**
 * routes/users.js — User profile and social graph routes
 *
 * GET  /api/users/search          — search users by name/username
 * GET  /api/users/suggestions     — "Who to Follow" suggestions
 * GET  /api/users/:username        — get a public profile
 * PUT  /api/users/profile          — update own profile (protected)
 * POST /api/users/:id/follow       — toggle follow/unfollow (protected)
 */

const express = require("express");
const { body } = require("express-validator");
const {
  getUserProfile,
  updateProfile,
  uploadAvatar,
  followUser,
  searchUsers,
  getSuggestions,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

const router = express.Router();

// ─── Public search (still requires auth so we know who is asking) ─────────────
router.get("/search", protect, searchUsers);
router.get("/suggestions", protect, getSuggestions);

// ─── Avatar upload (must come before /:username to avoid route collision) ─────
// upload.single("avatar") runs multer, then uploadAvatar saves the URL to DB
router.put("/avatar", protect, upload.single("avatar"), uploadAvatar);

// ─── Profile ──────────────────────────────────────────────────────────────────
router.get("/:username", protect, getUserProfile);

router.put(
  "/profile",
  protect,
  [
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("bio").optional().isLength({ max: 160 }).withMessage("Bio cannot exceed 160 characters"),
    body("location").optional().isLength({ max: 80 }).withMessage("Location cannot exceed 80 characters"),
  ],
  updateProfile
);

// ─── Social graph ─────────────────────────────────────────────────────────────
router.post("/:id/follow", protect, followUser);

module.exports = router;
