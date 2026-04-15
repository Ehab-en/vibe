/**
 * controllers/notificationController.js — Handlers for notification routes
 *
 * Exports:
 *   getNotifications   — fetch all notifications for the authenticated user
 *   markRead           — mark a single notification as read
 *   markAllRead        — mark every unread notification as read
 *   deleteNotification — delete a single notification
 */

const Notification = require("../models/Notification");

/**
 * GET /api/notifications
 * Returns all notifications for the authenticated user, newest-first,
 * with sender details populated.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", "name username avatar")
      .populate("post", "text");

    res.json(notifications);
  } catch (err) {
    console.error("getNotifications error:", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

/**
 * PUT /api/notifications/:id/read
 * Marks a single notification as read. Only the recipient may do this.
 *
 * @param {import('express').Request}  req — params.id
 * @param {import('express').Response} res
 */
const markRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (err) {
    console.error("markRead error:", err);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

/**
 * PUT /api/notifications/read-all
 * Marks all of the current user's unread notifications as read in one query.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("markAllRead error:", err);
    res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
};

/**
 * DELETE /api/notifications/:id
 * Permanently deletes a notification. Only the recipient may delete it.
 *
 * @param {import('express').Request}  req — params.id
 * @param {import('express').Response} res
 */
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted" });
  } catch (err) {
    console.error("deleteNotification error:", err);
    res.status(500).json({ message: "Failed to delete notification" });
  }
};

module.exports = { getNotifications, markRead, markAllRead, deleteNotification };
