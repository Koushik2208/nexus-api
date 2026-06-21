# Nexus API — Database Schema

This document explains every table, column, relationship, view, and index in the Nexus API database.

---

## Table of Contents

1. [Overview](#overview)
2. [Tables](#tables)
   - [workspaces](#workspaces)
   - [api_keys](#api_keys)
   - [users](#users)
   - [posts](#posts)
   - [comments](#comments)
   - [likes](#likes)
   - [follows](#follows)
   - [notifications](#notifications)
3. [Views](#views)
   - [feed_view](#feed_view)
   - [user_stats_view](#user_stats_view)
4. [Indexes](#indexes)
5. [Relationships Summary](#relationships-summary)

---

## Overview

The database has 8 tables. They are created in dependency order — each table only references tables that already exist above it.

```
workspaces
  └── api_keys        (each workspace has one API key)
  └── users           (each workspace has many users)
        └── posts     (each user has many posts)
              └── comments       (each post has many comments)
              └── likes          (each post can be liked by many users)
        └── follows              (users follow other users)
        └── notifications        (users receive notifications)
```

Every piece of data belongs to a workspace. This is how data isolation works — a query on workspace A will never return data from workspace B.

---

## Tables

---

### workspaces

A workspace is a private container for one frontend project. All data (users, posts, etc.) belongs to a workspace.

```sql
CREATE TABLE workspaces (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| Column | Type | Description |
|---|---|---|
| `id` | integer | Auto-incrementing primary key |
| `name` | varchar(100) | Name of the workspace, e.g. "My Portfolio Project" |
| `created_at` | timestamptz | When the workspace was created |

**Notes**
- Created via `POST /workspaces`.
- Deleting a workspace cascades to everything: api_keys, users, posts, comments, likes, follows, notifications.

---

### api_keys

Stores API keys that authenticate requests. Each workspace gets one key when it is created.

```sql
CREATE TABLE api_keys (
  id            SERIAL PRIMARY KEY,
  workspace_id  INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  key           VARCHAR(64) NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| Column | Type | Description |
|---|---|---|
| `id` | integer | Auto-incrementing primary key |
| `workspace_id` | integer | FK → workspaces.id |
| `key` | varchar(64) | A random 64-character hex string |
| `created_at` | timestamptz | When the key was generated |

**Notes**
- The `key` is generated using `crypto.randomBytes(32).toString("hex")`.
- It is returned once in the `POST /workspaces` response. There is no endpoint to retrieve it again — if lost, look it up in pgAdmin.
- The `key` column has a `UNIQUE` constraint — no two workspaces can have the same key.
- Every protected API request reads the `x-api-key` header and looks up a row in this table to find the workspace.

---

### users

Represents a social media user within a workspace. Usernames must be unique within a workspace but can repeat across different workspaces.

```sql
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  workspace_id  INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  username      VARCHAR(50) NOT NULL,
  display_name  VARCHAR(100),
  avatar_url    TEXT,
  bio           TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, username)
);
```

| Column | Type | Required | Description |
|---|---|---|---|
| `id` | integer | auto | Auto-incrementing primary key |
| `workspace_id` | integer | auto | FK → workspaces.id. Set from the API key, not the request body. |
| `username` | varchar(50) | yes | Unique handle within the workspace, e.g. "john_doe" |
| `display_name` | varchar(100) | no | Full name shown on a profile, e.g. "John Doe" |
| `avatar_url` | text | no | URL pointing to a profile picture |
| `bio` | text | no | Short description of the user |
| `created_at` | timestamptz | auto | When the user was created |

**Notes**
- The unique constraint is `(workspace_id, username)` — not just `username` alone. This means "john_doe" can exist in workspace 1 and workspace 2 without conflict.
- `workspace_id` is always taken from the verified API key (`req.workspace_id`), never from the request body.

---

### posts

A post is a piece of content created by a user. Equivalent to a tweet or a Facebook post.

```sql
CREATE TABLE posts (
  id            SERIAL PRIMARY KEY,
  workspace_id  INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  image_url     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| Column | Type | Required | Description |
|---|---|---|---|
| `id` | integer | auto | Auto-incrementing primary key |
| `workspace_id` | integer | auto | FK → workspaces.id. Set from the API key. |
| `user_id` | integer | yes | FK → users.id. Which user wrote this post. |
| `content` | text | yes | The text body of the post |
| `image_url` | text | no | Optional URL to an image attached to the post |
| `created_at` | timestamptz | auto | When the post was created |

**Notes**
- Deleting a post cascades to its comments, likes, and any notifications that reference it.

---

### comments

A comment is a reply to a post, written by a user.

```sql
CREATE TABLE comments (
  id          SERIAL PRIMARY KEY,
  post_id     INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| Column | Type | Required | Description |
|---|---|---|---|
| `id` | integer | auto | Auto-incrementing primary key |
| `post_id` | integer | yes | FK → posts.id. Which post this comment belongs to. |
| `user_id` | integer | yes | FK → users.id. Which user wrote this comment. |
| `content` | text | yes | The text of the comment |
| `created_at` | timestamptz | auto | When the comment was created |

**Notes**
- Comments do not have a `workspace_id` column. Workspace scoping is inherited through the post — if you can see the post, you can see its comments.

---

### likes

A like represents a user liking a post. A user can only like a post once.

```sql
CREATE TABLE likes (
  post_id     INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
```

| Column | Type | Description |
|---|---|---|
| `post_id` | integer | FK → posts.id |
| `user_id` | integer | FK → users.id |
| `created_at` | timestamptz | When the like was created |

**Notes**
- There is no `id` column. The primary key is a **composite key** of `(post_id, user_id)` — this pair must be unique, which enforces "one like per user per post" at the database level.
- Trying to insert a duplicate like returns a Postgres `23505` unique violation error, which the API converts to a `409 Conflict` response.

---

### follows

Represents a "follow" relationship between two users — one user following another.

```sql
CREATE TABLE follows (
  follower_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
```

| Column | Type | Description |
|---|---|---|
| `follower_id` | integer | FK → users.id. The user who is following. |
| `following_id` | integer | FK → users.id. The user being followed. |
| `created_at` | timestamptz | When the follow happened |

**Notes**
- Like `likes`, there is no `id` column. The composite primary key `(follower_id, following_id)` enforces uniqueness — you can only follow someone once.
- The `CHECK (follower_id <> following_id)` constraint prevents self-follows at the database level. The API also blocks this at the application level with a `400` response.
- `follows` has no `workspace_id` column. Workspace scoping is done by joining back to the `users` table to verify both users belong to the same workspace.

---

### notifications

A notification is created automatically when certain actions happen — likes, comments, and follows.

```sql
CREATE TABLE notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(30) NOT NULL,
  post_id     INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| Column | Type | Required | Description |
|---|---|---|---|
| `id` | integer | auto | Auto-incrementing primary key |
| `user_id` | integer | yes | FK → users.id. The user who receives the notification. |
| `actor_id` | integer | yes | FK → users.id. The user who triggered the action (liked, commented, followed). |
| `type` | varchar(30) | yes | What happened: `like`, `comment`, or `follow` |
| `post_id` | integer | sometimes | FK → posts.id. Only set for `like` and `comment` — null for `follow`. |
| `read_at` | timestamptz | — | Null if unread. Timestamp of when `PATCH /notifications/:id/read` was called. |
| `created_at` | timestamptz | auto | When the notification was created |

**Notes**
- Notifications are never created for self-actions. If you like your own post or comment on your own post, no notification is inserted.
- `read_at` uses `COALESCE(read_at, now())` on update — this means marking an already-read notification does nothing to the timestamp. It is safe to call multiple times.
- Deleting a post cascades to any notifications that reference it via `post_id`.

---

## Views

Views are saved SQL queries that you can query like a table. They do not store data — they run the underlying query every time you use them. The advantage is that the API can write simple `SELECT * FROM feed_view WHERE workspace_id = $1` instead of repeating complex joins everywhere.

---

### feed_view

Combines posts with their author's information and counts of likes and comments. This is what powers `GET /feed`.

```sql
CREATE OR REPLACE VIEW feed_view AS
SELECT
  p.id            AS post_id,
  p.workspace_id,
  p.content,
  p.image_url,
  p.created_at,
  u.id            AS user_id,
  u.username,
  u.display_name,
  u.avatar_url,
  COUNT(DISTINCT l.user_id)::int  AS like_count,
  COUNT(DISTINCT c.id)::int       AS comment_count
FROM posts p
JOIN users u ON u.id = p.user_id
LEFT JOIN likes l ON l.post_id = p.id
LEFT JOIN comments c ON c.post_id = p.id
GROUP BY p.id, p.workspace_id, p.content, p.image_url, p.created_at,
         u.id, u.username, u.display_name, u.avatar_url;
```

| Column | Source | Description |
|---|---|---|
| `post_id` | posts.id | The post's ID |
| `workspace_id` | posts.workspace_id | Used to scope results to the calling workspace |
| `content` | posts.content | Post text |
| `image_url` | posts.image_url | Optional image |
| `created_at` | posts.created_at | When the post was created |
| `user_id` | users.id | Author's ID |
| `username` | users.username | Author's username |
| `display_name` | users.display_name | Author's display name |
| `avatar_url` | users.avatar_url | Author's profile picture |
| `like_count` | COUNT(likes) | Number of likes on this post |
| `comment_count` | COUNT(comments) | Number of comments on this post |

**Why `::int` on the COUNT columns?**
Postgres returns `COUNT()` as a `bigint`. The Node.js `pg` driver parses `bigint` as a JavaScript string (e.g. `"12"` instead of `12`) to avoid precision loss on very large numbers. Casting to `::int` tells Postgres to return a regular integer, which `pg` correctly parses as a JavaScript number.

---

### user_stats_view

Aggregates counts per user — how many posts they have, how many followers, and how many people they follow. This powers `GET /users/:id/stats`.

```sql
CREATE OR REPLACE VIEW user_stats_view AS
SELECT
  u.id            AS user_id,
  u.username,
  COUNT(DISTINCT p.id)::int            AS post_count,
  COUNT(DISTINCT f1.follower_id)::int  AS follower_count,
  COUNT(DISTINCT f2.following_id)::int AS following_count,
  u.workspace_id
FROM users u
LEFT JOIN posts p    ON p.user_id = u.id
LEFT JOIN follows f1 ON f1.following_id = u.id
LEFT JOIN follows f2 ON f2.follower_id = u.id
GROUP BY u.id, u.username, u.workspace_id;
```

| Column | Source | Description |
|---|---|---|
| `user_id` | users.id | The user's ID |
| `username` | users.username | The user's username |
| `post_count` | COUNT(posts) | How many posts this user has written |
| `follower_count` | COUNT(follows where following_id = user) | How many people follow this user |
| `following_count` | COUNT(follows where follower_id = user) | How many people this user follows |
| `workspace_id` | users.workspace_id | Used to scope results to the calling workspace |

---

## Indexes

Indexes make queries faster by letting the database jump directly to matching rows instead of scanning the entire table.

```sql
CREATE INDEX idx_api_keys_workspace_id   ON api_keys(workspace_id);
CREATE INDEX idx_users_workspace_id      ON users(workspace_id);
CREATE INDEX idx_posts_workspace_id      ON posts(workspace_id);
CREATE INDEX idx_posts_user_id           ON posts(user_id);
CREATE INDEX idx_comments_post_id        ON comments(post_id);
CREATE INDEX idx_comments_user_id        ON comments(user_id);
CREATE INDEX idx_likes_user_id           ON likes(user_id);
CREATE INDEX idx_follows_following_id    ON follows(following_id);
CREATE INDEX idx_notifications_user_id   ON notifications(user_id);
```

| Index | Why it exists |
|---|---|
| `idx_api_keys_workspace_id` | Look up API keys by workspace (used when generating a key) |
| `idx_users_workspace_id` | Filter all users by workspace — used on almost every user query |
| `idx_posts_workspace_id` | Filter all posts by workspace — used on feed and post queries |
| `idx_posts_user_id` | Look up all posts by a specific user (`GET /users/:id/posts`) |
| `idx_comments_post_id` | Look up all comments on a post (`GET /posts/:postId/comments`) |
| `idx_comments_user_id` | Look up all comments by a user |
| `idx_likes_user_id` | The primary key on `likes` covers `(post_id, user_id)`. This index covers the reverse lookup — all likes by a user |
| `idx_follows_following_id` | The primary key on `follows` covers `(follower_id, following_id)`. This index covers the reverse — "who follows this person?" (`GET /users/:id/followers`) |
| `idx_notifications_user_id` | Look up all notifications for a user (`GET /notifications?user_id=`) |

---

## Relationships Summary

```
workspaces
  ├── api_keys         (workspace_id)               1 workspace → 1 api_key
  ├── users            (workspace_id)               1 workspace → many users
  │     ├── posts      (user_id)                    1 user → many posts
  │     │     ├── comments  (post_id)               1 post → many comments
  │     │     └── likes     (post_id)               1 post → many likes
  │     ├── follows    (follower_id / following_id)  users follow other users
  │     └── notifications (user_id / actor_id)       users notify other users
```

All foreign keys use `ON DELETE CASCADE` — deleting a parent row automatically deletes all child rows. For example:

- Delete a workspace → deletes its api_keys, users, posts, comments, likes, follows, notifications
- Delete a user → deletes their posts, comments, likes, follows, notifications
- Delete a post → deletes its comments, likes, and related notifications
