# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile — Vibe Backend (Node.js / Express)
#
# Multi-stage build:
#   Stage 1 (deps)  — install only production dependencies
#   Stage 2 (final) — copy app source + prod deps into a clean alpine image
#
# The final image is intentionally minimal to reduce attack surface.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: install dependencies ─────────────────────────────────────────────
FROM node:18-alpine AS deps

WORKDIR /app

# Copy package files first so Docker can cache the npm install layer
COPY package.json package-lock.json* ./

# Install only production dependencies (skips devDependencies like nodemon)
RUN npm install --omit=dev

# ── Stage 2: final image ──────────────────────────────────────────────────────
FROM node:18-alpine

WORKDIR /app

# Copy production node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all application source files
COPY . .

# Expose the Express server port (matches PORT env var default)
EXPOSE 5000

# Start the server using node directly (not nodemon — nodemon is for dev only)
CMD ["node", "server.js"]
