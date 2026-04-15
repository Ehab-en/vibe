/**
 * controllers/postController.js — Handlers for post-related routes
 *
 * Exports:
 *   createPost    — create a new post
 *   getFeedPosts  — get paginated posts for the home feed
 *   getPostById   — get a single post by ID
 *   updatePost    — update a post (author only)
 *   deletePost    — delete a post (author only)
 *   likePost      — toggle like/unlike on a post + create notification
 *   commentPost   — add a comment to a post + create notification
 *   deleteComment — remove a comment (comment author or post author)
 *   getUserPosts  — get all posts by a specific user
 *   searchPosts   — full-text search across posts
 *   getTrending   — extract and rank hashtags from recent posts
 */

const { validationResult } = require("express-validator");
const Post = require("../models/Post");
const Notification = require("../models/Notification");

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * POST /api/posts
 * Creates a new post for the authenticated user.
 *
 * @param {import('express').Request}  req — body: { text, image?, location? }
 * @param {import('express').Response} res
 */
const createPost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { text, isPublic } = req.body;

    // ── Image: prefer the uploaded file, fall back to nothing ─────────────────
    // When the client sends multipart/form-data, multer puts the file in req.file.
    // We build the full public URL so the browser can fetch it directly.
    let imageUrl = "";
    if (req.file) {
      const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
      imageUrl = `${serverUrl}/uploads/${req.file.filename}`;
    }

    // ── Location: FormData sends everything as strings, so JSON.parse it ──────
    let locationData = {};
    if (req.body.location) {
      try {
        locationData = typeof req.body.location === "string"
          ? JSON.parse(req.body.location)
          : req.body.location;
      } catch {
        locationData = {};
      }
    }

    // ── isPublic: FormData sends booleans as the string "true"/"false" ────────
    const publicFlag = req.body.isPublic === undefined
      ? true
      : req.body.isPublic === "true" || req.body.isPublic === true;

    const post = await Post.create({
      author: req.user._id,
      text,
      image: imageUrl,
      location: locationData,
      isPublic: publicFlag,
    });

    // Populate author info before returning
    await post.populate("author", "name username avatar");

    res.status(201).json(post);
  } catch (err) {
    console.error("createPost error:", err);
    res.status(500).json({ message: "Failed to create post" });
  }
};

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/posts/feed
 * Returns paginated posts from users the authenticated user follows,
 * plus their own posts, sorted newest-first.
 *
 * Query params: page (default 1), limit (default 10)
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const getFeedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build the set of user IDs whose posts should appear in the feed:
    // the current user + everyone they follow
    const feedUserIds = [req.user._id, ...req.user.following];

    const posts = await Post.find({
      author: { $in: feedUserIds },
      isPublic: true,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "name username avatar")
      .populate("comments.user", "name username avatar");

    const total = await Post.countDocuments({
      author: { $in: feedUserIds },
      isPublic: true,
    });

    res.json({ posts, page, totalPages: Math.ceil(total / limit), total });
  } catch (err) {
    console.error("getFeedPosts error:", err);
    res.status(500).json({ message: "Failed to fetch feed" });
  }
};

/**
 * GET /api/posts/explore
 * Returns all public posts sorted by newest / most liked.
 * Used on the Explore page.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const getExplorePosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "name username avatar");

    res.json(posts);
  } catch (err) {
    console.error("getExplorePosts error:", err);
    res.status(500).json({ message: "Failed to fetch explore posts" });
  }
};

/**
 * GET /api/posts/:id
 * Returns a single post by its MongoDB ID.
 *
 * @param {import('express').Request}  req — params.id
 * @param {import('express').Response} res
 */
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "name username avatar")
      .populate("comments.user", "name username avatar");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post);
  } catch (err) {
    console.error("getPostById error:", err);
    res.status(500).json({ message: "Failed to fetch post" });
  }
};

/**
 * GET /api/posts/user/:userId
 * Returns all posts authored by a specific user, newest-first.
 *
 * @param {import('express').Request}  req — params.userId
 * @param {import('express').Response} res
 */
const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId, isPublic: true })
      .sort({ createdAt: -1 })
      .populate("author", "name username avatar");

    res.json(posts);
  } catch (err) {
    console.error("getUserPosts error:", err);
    res.status(500).json({ message: "Failed to fetch user posts" });
  }
};

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * PUT /api/posts/:id
 * Allows the post author to update text/image/visibility.
 *
 * @param {import('express').Request}  req — params.id, body: { text?, image?, isPublic? }
 * @param {import('express').Response} res
 */
const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Only the author can edit
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this post" });
    }

    const { text, image, isPublic } = req.body;
    if (text !== undefined) post.text = text;
    if (image !== undefined) post.image = image;
    if (isPublic !== undefined) post.isPublic = isPublic;

    await post.save();
    await post.populate("author", "name username avatar");

    res.json(post);
  } catch (err) {
    console.error("updatePost error:", err);
    res.status(500).json({ message: "Failed to update post" });
  }
};

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * DELETE /api/posts/:id
 * Permanently removes a post. Only the author may do this.
 *
 * @param {import('express').Request}  req — params.id
 * @param {import('express').Response} res
 */
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    await post.deleteOne();

    // Clean up related notifications
    await Notification.deleteMany({ post: req.params.id });

    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error("deletePost error:", err);
    res.status(500).json({ message: "Failed to delete post" });
  }
};

// ─── Like / Unlike ────────────────────────────────────────────────────────────

/**
 * POST /api/posts/:id/like
 * Toggles a like on a post:
 *   — if the user already liked it → remove the like (unlike)
 *   — otherwise → add the like and create a notification for the post author
 *
 * Also keeps `likesCount` in sync with the likes array length.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id;
    const alreadyLiked = post.likes.some((id) => id.toString() === userId.toString());

    if (alreadyLiked) {
      // Unlike: pull the userId out of the likes array
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      // Like: push userId and create a notification (skip self-likes)
      post.likes.push(userId);

      if (post.author.toString() !== userId.toString()) {
        await Notification.create({
          recipient: post.author,
          sender: userId,
          type: "like",
          post: post._id,
          message: `${req.user.name} liked your post`,
        });
      }
    }

    // Keep the denormalized counter in sync
    post.likesCount = post.likes.length;
    await post.save();

    res.json({ likes: post.likes, likesCount: post.likesCount });
  } catch (err) {
    console.error("likePost error:", err);
    res.status(500).json({ message: "Failed to toggle like" });
  }
};

// ─── Comments ─────────────────────────────────────────────────────────────────

/**
 * POST /api/posts/:id/comment
 * Appends a comment to a post and notifies the post author.
 *
 * @param {import('express').Request}  req — body: { text }
 * @param {import('express').Response} res
 */
const commentPost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = { user: req.user._id, text: req.body.text };
    post.comments.push(comment);
    await post.save();

    // Notify the post author (unless they're commenting on their own post)
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: "comment",
        post: post._id,
        message: `${req.user.name} commented on your post`,
      });
    }

    // Return the populated post so the client can update its store
    await post.populate("comments.user", "name username avatar");
    res.json(post.comments);
  } catch (err) {
    console.error("commentPost error:", err);
    res.status(500).json({ message: "Failed to add comment" });
  }
};

/**
 * DELETE /api/posts/:id/comment/:commentId
 * Removes a comment. Only the comment's author or the post's author may do this.
 *
 * @param {import('express').Request}  req — params.id, params.commentId
 * @param {import('express').Response} res
 */
const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const isCommentAuthor = comment.user.toString() === req.user._id.toString();
    const isPostAuthor = post.author.toString() === req.user._id.toString();

    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    comment.deleteOne();
    await post.save();

    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error("deleteComment error:", err);
    res.status(500).json({ message: "Failed to delete comment" });
  }
};

// ─── Search ───────────────────────────────────────────────────────────────────

/**
 * GET /api/posts/search?q=keyword
 * Full-text search across post content using MongoDB's text index.
 *
 * @param {import('express').Request}  req — query.q
 * @param {import('express').Response} res
 */
const searchPosts = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.json([]);

    const posts = await Post.find(
      { $text: { $search: query }, isPublic: true },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(20)
      .populate("author", "name username avatar");

    res.json(posts);
  } catch (err) {
    console.error("searchPosts error:", err);
    res.status(500).json({ message: "Search failed" });
  }
};

// ─── Trending Hashtags ────────────────────────────────────────────────────────

/**
 * GET /api/posts/trending
 * Parses all recent public posts (last 7 days) for hashtags,
 * counts occurrences, and returns the top 10 sorted by frequency.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const getTrending = async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    // Only fetch the text field to keep the query light
    const posts = await Post.find({ createdAt: { $gte: since }, isPublic: true }).select("text");

    // Count hashtag occurrences across all fetched posts
    const tagCounts = {};
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;

    posts.forEach((post) => {
      const tags = post.text.match(hashtagRegex) || [];
      tags.forEach((tag) => {
        const lower = tag.toLowerCase();
        tagCounts[lower] = (tagCounts[lower] || 0) + 1;
      });
    });

    // Sort by count descending, take the top 10
    const trending = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    res.json(trending);
  } catch (err) {
    console.error("getTrending error:", err);
    res.status(500).json({ message: "Failed to fetch trending hashtags" });
  }
};

module.exports = {
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
};
