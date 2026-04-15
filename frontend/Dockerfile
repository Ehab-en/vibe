# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile — Vibe Frontend (React / Vite)
#
# Multi-stage build:
#   Stage 1 (builder) — install deps and compile the production bundle
#   Stage 2 (final)   — serve the static bundle with a lightweight HTTP server
#
# VITE_API_URL is a build-time ARG because Vite bakes env vars into the JS
# bundle during `npm run build`. Runtime env vars are NOT available to Vite.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Accept the API URL as a build argument (passed from docker-compose build.args)
ARG VITE_API_URL=http://localhost:5000
# Expose it as an environment variable so Vite picks it up during `npm run build`
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# ── Stage 2: serve ────────────────────────────────────────────────────────────
FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

# -s = SPA mode (all routes → index.html)
CMD ["serve", "-s", "dist", "-l", "3000"]
