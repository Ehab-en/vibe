# Vibe 🟣

A full-stack social media app built with the MERN stack.

**Live demo:** _coming soon — deploy to Render or Railway using the guide below_

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Redux Toolkit, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT stored in httpOnly cookies |
| Containers | Docker + docker-compose |
| Testing | Jest + React Testing Library |

---

## Features

- JWT authentication (register / login / logout)
- Create, edit, delete posts (280-char limit)
- Like / unlike posts with notification creation
- Comment on posts
- Follow / unfollow users
- Location tagging via browser Geolocation API
- Search posts (full-text) and users
- Trending hashtags (parsed from post text, last 7 days)
- Notification centre (like / comment / follow types)
- Explore page with public feed

---

## Project Structure

```
vibe/
├── backend/
│   ├── controllers/        authController, postController,
│   │                       userController, notificationController
│   ├── middleware/         authMiddleware.js (JWT protect)
│   ├── models/             User.js, Post.js, Notification.js
│   ├── routes/             auth.js, posts.js, users.js, notifications.js
│   ├── server.js
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/     Navbar, Sidebar, PostCard, ComposeBox,
│   │   │                   TrendingWidget, SuggestWidget
│   │   ├── pages/          LandingPage, HomePage, ProfilePage,
│   │   │                   CreatePostPage, NotificationsPage, ExplorePage
│   │   ├── store/          authSlice, postsSlice, notificationsSlice
│   │   └── tests/          4 test suites (Jest + RTL)
│   ├── Dockerfile
│   └── vite.config.js
├── docker-compose.yml
└── README.md
```

---

## Quick Start (Local — without Docker)

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`) or a MongoDB Atlas URI

### 1. Clone and set up environment

```bash
git clone <your-repo-url>
cd vibe

# Backend env
cp backend/.env.example backend/.env
# Edit backend/.env and set MONGO_URI + JWT_SECRET
```

### 2. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Run the development servers

```bash
# Terminal 1 — backend (port 5000)
cd backend && npm run dev

# Terminal 2 — frontend (port 3000)
cd frontend && npm run dev
```

Open **http://localhost:3000**

---

## Quick Start (Docker)

```bash
# From the project root
cp backend/.env.example backend/.env
# Set JWT_SECRET in backend/.env

docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| MongoDB | mongodb://localhost:27017/vibe |

Stop everything:

```bash
docker-compose down          # keep data
docker-compose down -v       # also wipe the MongoDB volume
```

---

## Running Tests

```bash
cd frontend
npm test
```

Four test suites:

| File | What it tests |
|---|---|
| `PostCard.test.jsx` | PostCard renders correctly with like button |
| `ComposeBox.test.jsx` | Character counter updates on input |
| `Navbar.test.jsx` | Navbar renders correct links when logged in |
| `LandingPage.test.jsx` | LandingPage shows login and register tabs |

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Description | Default |
|---|---|---|
| `MONGO_URI` | MongoDB connection string | `mongodb://mongo:27017/vibe` |
| `JWT_SECRET` | Secret key for signing JWTs | _(required — set a long random string)_ |
| `PORT` | Express server port | `5000` |
| `NODE_ENV` | `development` or `production` | `development` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` |

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Get current user |

### Posts
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/posts/feed` | Home feed (paginated) |
| GET | `/api/posts/explore` | All public posts |
| GET | `/api/posts/trending` | Top hashtags |
| GET | `/api/posts/search?q=` | Full-text search |
| GET | `/api/posts/user/:userId` | Posts by user |
| POST | `/api/posts` | Create post |
| PUT | `/api/posts/:id` | Update post |
| DELETE | `/api/posts/:id` | Delete post |
| POST | `/api/posts/:id/like` | Toggle like |
| POST | `/api/posts/:id/comment` | Add comment |
| DELETE | `/api/posts/:id/comment/:commentId` | Delete comment |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/:username` | Get profile |
| PUT | `/api/users/profile` | Update own profile |
| POST | `/api/users/:id/follow` | Toggle follow |
| GET | `/api/users/search?q=` | Search users |
| GET | `/api/users/suggestions` | Who to follow |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | List notifications |
| PUT | `/api/notifications/:id/read` | Mark one read |
| PUT | `/api/notifications/read-all` | Mark all read |
| DELETE | `/api/notifications/:id` | Delete notification |

---

## Deploying to Render

1. Push the repo to GitHub.
2. Create two **Web Services** on Render — one for `backend/`, one for `frontend/`.
3. Create a **MongoDB** instance (MongoDB Atlas free tier recommended).
4. Set environment variables in the Render dashboard matching `backend/.env.example`.
5. For the frontend build, set **Build command** to `npm run build` and **Publish directory** to `dist`.

## Deploying to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli
railway login
railway init
railway add          # add MongoDB plugin
railway up
```

Set environment variables in the Railway dashboard.

---

## Design Tokens

| Token | Value |
|---|---|
| Primary color | `#534AB7` (purple) |
| Font | `system-ui, sans-serif` |
| Card border | `1px solid #e5e5e5` |
| Card radius | `12px` |
| Navbar height | `56px` (h-14) |
