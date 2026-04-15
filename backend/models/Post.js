/**
 * models/Post.js — Mongoose schema and model for Post documents
 *
 * Each post belongs to one author, can carry an image,
 * an optional geo-location, an array of likes (user IDs),
 * and an embedded comments array.
 */

const mongoose = require("mongoose");

/** Embedded sub-schema for individual comments */
const commentSchema = new mongoose.Schema(
  {
    /** User who wrote the comment */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /** Comment body text */
    text: {
      type: String,
      required: [true, "Comment text is required"],
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true, // gives each comment its own createdAt / updatedAt
  }
);

const postSchema = new mongoose.Schema(
  {
    /** Reference to the user who created this post */
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /** The post body (up to 280 characters, Twitter-style) */
    text: {
      type: String,
      required: [true, "Post text is required"],
      maxlength: [280, "Post cannot exceed 280 characters"],
    },

    /** Optional URL of an attached image */
    image: {
      type: String,
      default: "",
    },

    /**
     * Optional geo-location tag attached by the client
     * via the browser Geolocation API
     */
    location: {
      name: { type: String, default: "" },
      lat: { type: Number },
      lng: { type: Number },
    },

    /** Array of user IDs who have liked this post (used for toggle checks) */
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    /**
     * Denormalized like count — kept in sync whenever a like/unlike happens.
     * Allows sorting by popularity without running an aggregation pipeline.
     */
    likesCount: {
      type: Number,
      default: 0,
    },

    /** Embedded array of comment sub-documents */
    comments: [commentSchema],

    /** Whether non-followers can see this post */
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Text index for full-text search on post content ─────────────────────────
postSchema.index({ text: "text" });

module.exports = mongoose.model("Post", postSchema);
