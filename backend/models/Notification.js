/**
 * models/Notification.js — Mongoose schema and model for Notification documents
 *
 * Created automatically on the server when users interact:
 *   • "like"    — someone liked recipient's post
 *   • "comment" — someone commented on recipient's post
 *   • "follow"  — someone followed the recipient
 */

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    /** The user who receives this notification */
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /** The user whose action triggered the notification */
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /** Category of interaction that triggered this notification */
    type: {
      type: String,
      enum: ["like", "comment", "follow"],
      required: true,
    },

    /**
     * The post this notification relates to (null for "follow" notifications).
     * Lets the frontend link directly to the relevant post.
     */
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },

    /** Human-readable description shown in the notifications list */
    message: {
      type: String,
      required: true,
    },

    /** Whether the recipient has viewed this notification */
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index so we can efficiently query "all unread notifications for user X"
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
