# Nexus API

A social-media-style backend API built for frontend development and practice.

The idea is simple: instead of building a real backend every time you start a frontend project, you use Nexus API. It gives you realistic social media data — users, posts, comments, likes, follows, notifications — through a clean REST API that is already deployed and ready to use.

---

## What it does

- Gives you a private **workspace** per project. Your data is isolated from everyone else's.
- Lets you seed your workspace with users and posts by uploading an Excel or CSV file.
- Returns realistic, paginated data for feeds, profiles, search, and notifications.
- Includes frontend testing tools — simulate slow networks, empty states, and error states by adding a query parameter.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express 5 |
| Database | PostgreSQL (Neon, managed cloud) |
| Deployment | Vercel |

---

## Live URL

```
https://nexus-api.kreatenvibe.com/
```

Replace this with your actual Vercel deployment URL.

---

## How workspaces work

Every API call belongs to a **workspace**. Think of a workspace as your private project space.

1. You create a workspace — you get back an API key.
2. You include that API key in every request as a header: `x-api-key: YOUR_KEY`.
3. Every user, post, comment, like, follow, and notification you create is locked to that workspace. Other workspaces cannot see or touch your data.

This means you can have multiple frontend projects all using the same Nexus API instance without any data leaking between them.

---

## Authentication

Almost every endpoint requires an API key. You get the key when you create a workspace.

Add it to every request as a header:

```
x-api-key: your-api-key-here
```

The only endpoint that does NOT require a key is `POST /workspaces` — because that is how you get your first key.

---

## Pagination

List endpoints return paginated results using **cursor-based pagination** (not page numbers).

### How it works

Instead of asking for "page 2", you ask for "everything after the last item I saw". This is faster and doesn't break when new items are added.

### Query parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | number | 20 | How many items to return (max 100) |
| `cursor` | number | none | The `id` of the last item you received |

### Response shape

```json
{
  "items": [...],
  "next_cursor": 42
}
```

- If `next_cursor` is a number, pass it as `?cursor=42` in your next request to get the next page.
- If `next_cursor` is `null`, you have reached the end — there are no more items.

> The key name varies by endpoint: `users`, `posts`, `notifications`, etc. See each endpoint below.

---

## Frontend Testing Tools

These query parameters work on **every endpoint**. They help you test UI states that are hard to trigger in real life.

| Parameter | Example | What it does |
|---|---|---|
| `?delay=ms` | `?delay=3000` | Waits N milliseconds before responding. Max 10000ms. Use to test loading spinners. |
| `?error=code` | `?error=500` | Immediately returns that HTTP error. Use to test error banners. |
| `?empty=true` | `?empty=true` | Returns empty arrays instead of real data. Use to test empty states. |
| `?partial=true` | `?partial=true` | Returns only 2 items in every array. Use to test sparse layouts. |

Example — test your loading spinner on the feed:
```
GET /feed?delay=2000
```

Example — test your error banner:
```
GET /feed?error=503
```

---

## API Endpoints

### Health

#### `GET /health`

Check if the server and database are running.

No authentication required.

**Response**
```json
{
  "status": "ok",
  "db": "connected"
}
```

---

### Workspaces

#### `POST /workspaces`

Create a new workspace. Returns an API key — save it, it is only shown once.

No authentication required.

**Request body**
```json
{
  "name": "My Project"
}
```

**Response** `201`
```json
{
  "id": 1,
  "name": "My Project",
  "created_at": "2026-06-20T10:00:00.000Z",
  "api_key": "a3f9c2e1b4d7..."
}
```

---

#### `GET /workspaces`

List all workspaces.

Requires `x-api-key`.

**Response** `200`
```json
[
  { "id": 1, "name": "My Project", "created_at": "..." }
]
```

---

#### `GET /workspaces/:id`

Get a single workspace by ID.

Requires `x-api-key`.

**Response** `200`
```json
{
  "id": 1,
  "name": "My Project",
  "created_at": "..."
}
```

---

#### `POST /workspaces/:id/reset`

Delete all data in the workspace — users, posts, comments, likes, follows, notifications. The workspace itself and its API key are kept.

Requires `x-api-key` for the same workspace (you cannot reset someone else's workspace).

**Response** `200`
```json
{
  "message": "workspace reset"
}
```

---

#### `POST /workspaces/:id/import`

Upload a CSV or Excel file to bulk-import data into the workspace.

Requires `x-api-key` for the same workspace.

The file must be sent as `multipart/form-data` with the field name `file`. Maximum file size: 10MB.

**Query parameter**

| Parameter | Required | Values |
|---|---|---|
| `type` | yes | `users`, `posts`, `comments`, `likes`, `follows` |

**Example request (curl)**
```bash
curl -X POST https://YOUR_URL/workspaces/1/import?type=users \
  -H "x-api-key: YOUR_KEY" \
  -F "file=@users.csv"
```

**File format — users**

| Column | Required | Description |
|---|---|---|
| `username` | yes | Unique within the workspace |
| `display_name` | no | Full name shown on profile |
| `avatar_url` | no | URL to profile picture |
| `bio` | no | Short bio text |

**File format — posts**

| Column | Required | Description |
|---|---|---|
| `username` | yes | Must match an existing user in this workspace |
| `content` | yes | Post text |
| `image_url` | no | URL to post image |

**File format — comments**

| Column | Required | Description |
|---|---|---|
| `post_id` | yes | ID of the post to comment on |
| `username` | yes | Must match an existing user |
| `content` | yes | Comment text |

**File format — likes**

| Column | Required | Description |
|---|---|---|
| `post_id` | yes | ID of the post to like |
| `username` | yes | Must match an existing user |

**File format — follows**

| Column | Required | Description |
|---|---|---|
| `follower_username` | yes | The user who follows |
| `following_username` | yes | The user being followed |

**Response** `200`
```json
{
  "imported": 25,
  "skipped": 2,
  "errors": []
}
```

---

### Users

All user endpoints require `x-api-key`. Results are always scoped to the calling workspace — you will never see another workspace's users.

---

#### `POST /users`

Create a new user.

**Request body**
```json
{
  "username": "john_doe",
  "display_name": "John Doe",
  "avatar_url": "https://example.com/avatar.jpg",
  "bio": "Frontend developer"
}
```

Only `username` is required.

**Response** `201`
```json
{
  "id": 1,
  "workspace_id": 1,
  "username": "john_doe",
  "display_name": "John Doe",
  "avatar_url": "https://example.com/avatar.jpg",
  "bio": "Frontend developer",
  "created_at": "..."
}
```

---

#### `GET /users`

List all users in the workspace. Supports pagination.

**Query parameters**

| Parameter | Default | Description |
|---|---|---|
| `limit` | 20 | Items per page (max 100) |
| `cursor` | none | Last user `id` from previous page |

**Response** `200`
```json
{
  "users": [
    { "id": 1, "username": "john_doe", "display_name": "John Doe", ... }
  ],
  "next_cursor": 1
}
```

---

#### `GET /users/:id`

Get a single user by ID.

**Response** `200`
```json
{
  "id": 1,
  "workspace_id": 1,
  "username": "john_doe",
  "display_name": "John Doe",
  "avatar_url": "...",
  "bio": "...",
  "created_at": "..."
}
```

---

#### `GET /users/:id/posts`

Get all posts written by a user, newest first.

**Response** `200`
```json
[
  {
    "id": 5,
    "user_id": 1,
    "content": "Hello world",
    "image_url": null,
    "created_at": "..."
  }
]
```

---

#### `GET /users/:id/stats`

Get a user's counts — how many posts, followers, and people they follow.

**Response** `200`
```json
{
  "user_id": 1,
  "username": "john_doe",
  "post_count": 12,
  "follower_count": 340,
  "following_count": 75
}
```

---

#### `GET /users/:id/followers`

Get a list of users who follow this user.

**Response** `200`
```json
[
  { "id": 3, "username": "jane_doe", "display_name": "Jane Doe", ... }
]
```

---

#### `GET /users/:id/following`

Get a list of users this user follows.

**Response** `200`
```json
[
  { "id": 5, "username": "alex_smith", "display_name": "Alex Smith", ... }
]
```

---

### Posts

All post endpoints require `x-api-key`.

---

#### `POST /posts`

Create a new post.

**Request body**
```json
{
  "user_id": 1,
  "content": "This is my first post!",
  "image_url": "https://example.com/photo.jpg"
}
```

Only `user_id` and `content` are required.

**Response** `201`
```json
{
  "id": 1,
  "workspace_id": 1,
  "user_id": 1,
  "content": "This is my first post!",
  "image_url": null,
  "created_at": "..."
}
```

---

#### `GET /posts/:id`

Get a single post by ID.

**Response** `200`
```json
{
  "id": 1,
  "workspace_id": 1,
  "user_id": 1,
  "content": "This is my first post!",
  "image_url": null,
  "created_at": "..."
}
```

---

#### `DELETE /posts/:id`

Delete a post and all its comments, likes, and notifications.

**Response** `204` (no body)

---

### Comments

All comment endpoints require `x-api-key`.

---

#### `POST /posts/:postId/comments`

Add a comment to a post.

**Request body**
```json
{
  "user_id": 2,
  "content": "Great post!"
}
```

**Response** `201`
```json
{
  "id": 1,
  "post_id": 1,
  "user_id": 2,
  "content": "Great post!",
  "created_at": "..."
}
```

---

#### `GET /posts/:postId/comments`

Get comments on a post, oldest first. Supports pagination.

**Query parameters**

| Parameter | Default | Description |
|---|---|---|
| `limit` | 20 | Items per page (max 100) |
| `cursor` | none | Last comment `id` from previous page |

**Response** `200`
```json
{
  "comments": [
    { "id": 1, "post_id": 1, "user_id": 2, "content": "Great post!", "created_at": "..." }
  ],
  "next_cursor": 1
}
```

---

### Likes

All like endpoints require `x-api-key`.

---

#### `POST /posts/:postId/like`

Like a post.

**Request body**
```json
{
  "user_id": 2
}
```

**Response** `201`
```json
{
  "post_id": 1,
  "user_id": 2,
  "created_at": "..."
}
```

Returns `409 Conflict` if the user already liked this post.

---

#### `DELETE /posts/:postId/like`

Unlike a post.

**Request body**
```json
{
  "user_id": 2
}
```

**Response** `204` (no body)

Returns `404` if the like does not exist.

---

### Follows

All follow endpoints require `x-api-key`.

---

#### `POST /users/:userId/follow`

Follow a user.

**Request body**
```json
{
  "follower_id": 1
}
```

**Response** `201`
```json
{
  "follower_id": 1,
  "following_id": 3,
  "created_at": "..."
}
```

Returns `400` if a user tries to follow themselves.
Returns `409 Conflict` if already following.

---

#### `DELETE /users/:userId/follow`

Unfollow a user.

**Request body**
```json
{
  "follower_id": 1
}
```

**Response** `204` (no body)

---

### Feed

Requires `x-api-key`.

---

#### `GET /feed`

Get a paginated feed of posts for the workspace, enriched with author info and counts. This is the main endpoint for building a social feed UI.

**Query parameters**

| Parameter | Default | Options | Description |
|---|---|---|---|
| `limit` | 20 | 1–100 | Items per page |
| `cursor` | none | number | Last `post_id` from previous page |
| `sort` | `newest` | `newest`, `oldest` | Sort order |
| `user_id` | none | number | When provided, returns only posts from users this person follows |

**Response** `200`
```json
{
  "posts": [
    {
      "post_id": 5,
      "workspace_id": 1,
      "content": "Hello world",
      "image_url": null,
      "created_at": "...",
      "user_id": 1,
      "username": "john_doe",
      "display_name": "John Doe",
      "avatar_url": "...",
      "like_count": 12,
      "comment_count": 3
    }
  ],
  "next_cursor": 5
}
```

> Note: the cursor for feed uses `post_id`, not `id`.

---

### Search

Requires `x-api-key`.

---

#### `GET /search?q=`

Search for users and posts in the workspace.

**Query parameters**

| Parameter | Required | Description |
|---|---|---|
| `q` | yes | Search term (case-insensitive) |
| `limit` | no | Max results per list, default 20 (max 100) |

Searches users by `username` and `display_name`. Searches posts by `content`.

**Response** `200`
```json
{
  "users": [
    { "id": 1, "username": "john_doe", "display_name": "John Doe", ... }
  ],
  "posts": [
    { "id": 3, "content": "...", "user_id": 1, ... }
  ]
}
```

---

### Notifications

Requires `x-api-key`.

Notifications are created automatically when:
- Someone likes your post → type `like`
- Someone comments on your post → type `comment`
- Someone follows you → type `follow`

Self-actions do not create notifications (liking your own post does nothing).

---

#### `GET /notifications`

Get notifications for a user, newest first. Supports pagination.

**Query parameters**

| Parameter | Required | Default | Description |
|---|---|---|---|
| `user_id` | yes | — | The user whose notifications to fetch |
| `limit` | no | 20 | Items per page (max 100) |
| `cursor` | no | none | Last notification `id` from previous page |

**Response** `200`
```json
{
  "notifications": [
    {
      "id": 1,
      "user_id": 1,
      "actor_id": 2,
      "type": "like",
      "post_id": 5,
      "read_at": null,
      "created_at": "..."
    }
  ],
  "next_cursor": 1
}
```

`read_at` is `null` if unread, or a timestamp if already read.

---

#### `PATCH /notifications/:id/read`

Mark a notification as read.

Calling this on an already-read notification is safe — it returns `200` without changing the original `read_at` timestamp.

**Response** `200`
```json
{
  "id": 1,
  "user_id": 1,
  "actor_id": 2,
  "type": "like",
  "post_id": 5,
  "read_at": "2026-06-20T10:05:00.000Z",
  "created_at": "..."
}
```

---

## Error Responses

All errors return the same JSON shape:

```json
{
  "error": "description of what went wrong"
}
```

| Status | Meaning |
|---|---|
| `400` | Bad request — missing or invalid field |
| `401` | Missing or invalid API key |
| `403` | Forbidden — you do not have permission (e.g. resetting another workspace) |
| `404` | Not found |
| `409` | Conflict — duplicate action (e.g. liking the same post twice) |
| `500` | Internal server error |

---

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL running locally
- pgAdmin (optional, to manage the database)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/nexus-api.git
cd nexus-api

# 2. Install dependencies
npm install

# 3. Create a .env file
cp .env.example .env
# Fill in your local database credentials

# 4. Create the database
# Open pgAdmin and create a database called nexus_api
# Then run sql/schema.sql and sql/views.sql against it

# 5. Start the dev server
npm run dev
```

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the server listens on | `3000` |
| `PGHOST` | PostgreSQL host | `localhost` |
| `PGPORT` | PostgreSQL port | `5432` |
| `PGDATABASE` | Database name | `nexus_api` |
| `PGUSER` | Database user | `postgres` |
| `PGPASSWORD` | Database password | `yourpassword` |
| `DATABASE_URL` | Full connection string (overrides PG* vars when set) | `postgresql://user:pass@host/db` |

> For local development, set the individual `PG*` variables. `DATABASE_URL` is used in production (Vercel + Neon).

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start with auto-reload on file changes |
| `npm start` | Start without auto-reload |
| `npm run build` | Compile TypeScript to `dist/` |

---

## Project Structure

```
src/
  app.ts                  — Express app setup, middleware, routes
  server.ts               — Starts the HTTP server
  errors.ts               — Custom error classes (ValidationError, NotFoundError, etc.)
  db/
    pool.ts               — PostgreSQL connection pool
  middleware/
    apiKey.ts             — x-api-key authentication
    errorHandler.ts       — Global error handler
    devTools.ts           — Frontend testing tools (?delay, ?error, ?empty, ?partial)
  modules/
    workspaces/           — Workspace CRUD + reset + import
    users/                — User CRUD + posts/stats/followers/following
    posts/                — Post CRUD
    comments/             — Comments on posts
    likes/                — Like/unlike posts
    follows/              — Follow/unfollow users
    feed/                 — Paginated enriched feed
    search/               — Search users and posts
    notifications/        — Notification list + mark as read
    import/               — Excel/CSV bulk import logic
    apiKeys/              — API key generation and lookup
  types/
    index.ts              — TypeScript interfaces for all tables and views
    express.d.ts          — Extends Express Request with workspace_id
  utils/
    pagination.ts         — Shared cursor pagination parser

sql/
  schema.sql              — Table definitions and indexes
  views.sql               — feed_view and user_stats_view
```
