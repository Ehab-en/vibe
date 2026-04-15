/**
 * routes/notifications.js — Notification routes
 *
 * All routes are protected (require JWT cookie).
 *
 * GET    /api/notifications          — list notifications for current user
 * PUT    /api/notifications/read-all — mark all as read
 * PUT    /api/notifications/:id/read — mark one as read
 * DELETE /api/notifications/:id      — delete one notification
 */

const express = require("express");
const {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All notification routes require authentication
router.use(protect);

router.get("/", getNotifications);
router.put("/read-all", markAllRead);       // must be before /:id to avoid route collision
router.put("/:id/read", markRead);
router.delete("/:id", deleteNotification);

module.exports = router;
