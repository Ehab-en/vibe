/**
 * routes/posts.js — Post CRUD and interaction routes
 *
 * All routes require authentication (protect middleware).
 *
 * GET    /api/posts/feed            — paginated home feed
 * GET    /api/posts/explore         — explore page posts
 * GET    /api/posts/trending        — trending hashtags
 * GET    /api/posts/search          — full-text post search
 * GET    /api/posts/user/:userId    — all posts by a user
 * GET    /api/posts/:id             — single post
 * POST   /api/posts                 — create post
 * PUT    /api/posts/:id             — update post
 * DELETE /api/posts/:id             — delete post
 * POST   /api/posts/:id/like        — toggle like
 * POST   /api/posts/:id/comment     — add comment
 * DELETE /api/posts/:id/comment/:commentId — delete comment
 */

const express = require("express");
const { body } = require("express-validator");
const {
  createPost,
  getFeedPosts,
  getExplorePosts,
  getPostById,
  getUserPosts,
  updatePost,
  deletePost,
  likePost,
  commentPost,
  deleteComment,
  searchPosts,
  getTrending,
} = require("../controllers/postController");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

const router = express.Router();

// All post routes require a valid JWT cookie
router.use(protect);

// ─── Specific named routes first (to avoid :id capturing them) ────────────────
router.get("/feed", getFeedPosts);
router.get("/explore", getExplorePosts);
router.get("/trending", getTrending);
router.get("/search", searchPosts);
router.get("/user/:userId", getUserPosts);

// ─── Post CRUD ────────────────────────────────────────────────────────────────
router.get("/:id", getPostById);

router.post(
  "/",
  // multer must run first so req.file and req.body are populated before validators
  upload.single("image"),
  [
    body("text")
      .trim()
      .notEmpty()
      .withMessage("Post text is required")
      .isLength({ max: 280 })
      .withMessage("Post cannot exceed 280 characters"),
  ],
  createPost
);

router.put("/:id", updatePost);
router.delete("/:id", deletePost);

// ─── Interactions ─────────────────────────────────────────────────────────────
router.post("/:id/like", likePost);

router.post(
  "/:id/comment",
  [
    body("text")
      .trim()
      .notEmpty()
      .withMessage("Comment text is required")
      .isLength({ max: 500 })
      .withMessage("Comment cannot exceed 500 characters"),
  ],
  commentPost
);

router.delete("/:id/comment/:commentId", deleteComment);

module.exports = router;
