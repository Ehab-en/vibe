/**
 * controllers/userController.js — Handlers for user profile routes
 *
 * Exports:
 *   getUserProfile  — get any user's public profile
 *   updateProfile   — update the authenticated user's own profile
 *   followUser      — toggle follow/unfollow + create notification
 *   searchUsers     — search users by name or username
 *   getSuggestions  — return users the current user doesn't follow yet
 */

const User = require("../models/User");
const Notification = require("../models/Notification");
const { validationResult } = require("express-validator");

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * GET /api/users/:username
 * Returns a user's public profile by their username handle.
 *
 * @param {import('express').Request}  req — params.username
 * @param {import('express').Response} res
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select("-password")
      .populate("followers", "name username avatar")
      .populate("following", "name username avatar");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("getUserProfile error:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

/**
 * PUT /api/users/profile
 * Updates the authenticated user's name, bio, location, or avatar.
 *
 * @param {import('express').Request}  req — body: { name?, bio?, location?, avatar? }
 * @param {import('express').Response} res
 */
const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, bio, location, avatar } = req.body;

    // Build update object with only provided fields
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,          // return the updated document
      runValidators: true // apply schema validators on update
    }).select("-password");

    res.json(user);
  } catch (err) {
    console.error("updateProfile error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

// ─── Follow / Unfollow ────────────────────────────────────────────────────────

/**
 * POST /api/users/:id/follow
 * Toggles a follow relationship between the authenticated user and another user:
 *   — if already following → unfollow (remove from both arrays)
 *   — otherwise → follow (add to both arrays) and create a notification
 *
 * @param {import('express').Request}  req — params.id (target user's MongoDB ID)
 * @param {import('express').Response} res
 */
const followUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    const currentUser = await User.findById(req.user._id);

    const isFollowing = currentUser.following.some(
      (id) => id.toString() === req.params.id
    );

    if (isFollowing) {
      // Unfollow: remove from both arrays atomically
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { following: req.params.id },
      });
      await User.findByIdAndUpdate(req.params.id, {
        $pull: { followers: req.user._id },
      });

      return res.json({ following: false, message: "Unfollowed successfully" });
    } else {
      // Follow: push to both arrays
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { following: req.params.id }, // addToSet prevents duplicates
      });
      await User.findByIdAndUpdate(req.params.id, {
        $addToSet: { followers: req.user._id },
      });

      // Notify the target user (unless they follow themselves — already blocked above)
      await Notification.create({
        recipient: req.params.id,
        sender: req.user._id,
        type: "follow",
        message: `${req.user.name} started following you`,
      });

      return res.json({ following: true, message: "Followed successfully" });
    }
  } catch (err) {
    console.error("followUser error:", err);
    res.status(500).json({ message: "Failed to update follow status" });
  }
};

// ─── Search & Suggestions ─────────────────────────────────────────────────────

/**
 * GET /api/users/search?q=keyword
 * Returns users whose name or username contains the search query.
 *
 * @param {import('express').Request}  req — query.q
 * @param {import('express').Response} res
 */
const searchUsers = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.json([]);

    // Case-insensitive partial match on name or username
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
      ],
    })
      .select("name username avatar bio")
      .limit(20);

    res.json(users);
  } catch (err) {
    console.error("searchUsers error:", err);
    res.status(500).json({ message: "Search failed" });
  }
};

/**
 * GET /api/users/suggestions
 * Returns up to 5 users the authenticated user is NOT already following.
 * Used in the "Who to Follow" sidebar widget.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const getSuggestions = async (req, res) => {
  try {
    // Exclude the current user and anyone they already follow
    const excluded = [req.user._id, ...req.user.following];

    const suggestions = await User.find({ _id: { $nin: excluded } })
      .select("name username avatar bio followers")
      .limit(5);

    res.json(suggestions);
  } catch (err) {
    console.error("getSuggestions error:", err);
    res.status(500).json({ message: "Failed to fetch suggestions" });
  }
};

// ─── Avatar Upload ────────────────────────────────────────────────────────────

/**
 * PUT /api/users/avatar
 * Receives a multipart upload (field name "avatar"), saves the file to disk,
 * and writes the public URL into the user's avatar field in MongoDB.
 *
 * Multer must run before this handler (applied in the route file).
 *
 * @param {import('express').Request}  req — req.file set by multer
 * @param {import('express').Response} res
 */
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Build the publicly accessible URL for this file.
    // SERVER_URL must be set in .env (e.g. http://localhost:5000 locally,
    // or https://your-app.onrender.com in production).
    const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
    const avatarUrl = `${serverUrl}/uploads/${req.file.filename}`;

    // Persist the new URL to MongoDB
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    ).select("-password");

    res.json({ avatar: user.avatar, user });
  } catch (err) {
    console.error("uploadAvatar error:", err);
    res.status(500).json({ message: "Failed to upload avatar" });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  uploadAvatar,
  followUser,
  searchUsers,
  getSuggestions,
};
