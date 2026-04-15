/**
 * middleware/uploadMiddleware.js — Multer configuration for avatar image uploads
 *
 * Stores uploaded files on disk at /app/uploads/ (Docker) or ./uploads/ (local).
 * Only image MIME types are accepted.
 * Maximum file size: 5 MB.
 *
 * Usage: add `upload.single("avatar")` before the route handler.
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure the uploads directory exists at startup
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Disk storage engine — saves files to the uploads/ directory with a
 * timestamped filename to avoid collisions.
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),

  /**
   * Generates a unique filename: avatar-<userId>-<timestamp><ext>
   * Using the user ID means each user only ever has one avatar on disk
   * if you clean up old files (optional enhancement).
   */
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `avatar-${req.user._id}-${Date.now()}${ext}`;
    cb(null, name);
  },
});

/**
 * File type filter — rejects anything that isn't an image.
 *
 * @param {import('express').Request} _req
 * @param {Express.Multer.File} file
 * @param {multer.FileFilterCallback} cb
 */
const fileFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = { upload, UPLOADS_DIR };
