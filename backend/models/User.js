/**
 * models/User.js — Mongoose schema and model for User documents
 *
 * Stores profile info, hashed password, and social graph arrays.
 * Password hashing is done via a pre-save hook using bcryptjs.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    /** Display name shown on profile */
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    /** Unique @handle used in URLs and mentions */
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9_]+$/, "Username can only contain letters, numbers, and underscores"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },

    /** Email address — must be unique */
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },

    /** Bcrypt-hashed password — never returned in queries (select: false) */
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // excluded from query results by default
    },

    /** Short bio displayed on the profile page */
    bio: {
      type: String,
      default: "",
      maxlength: [160, "Bio cannot exceed 160 characters"],
    },

    /** City / country text for the profile card */
    location: {
      type: String,
      default: "",
      maxlength: [80, "Location cannot exceed 80 characters"],
    },

    /** URL of the user's profile picture */
    avatar: {
      type: String,
      default: "",
    },

    /** Array of user IDs that follow this user */
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    /** Array of user IDs this user follows */
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// ─── Pre-save hook: hash password before storing ──────────────────────────────

/**
 * Hashes the plain-text password with bcrypt (salt rounds = 12)
 * before the document is saved to the database.
 * Only runs when the password field has been modified.
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance method: compare passwords ──────────────────────────────────────

/**
 * Compares a plain-text candidate password against the stored hash.
 * @param {string} candidatePassword — the raw password from the login form
 * @returns {Promise<boolean>} true if passwords match
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
