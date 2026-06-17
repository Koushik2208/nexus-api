-- Phase 12: PostgreSQL Views — frontend-ready aggregated data

CREATE OR REPLACE VIEW feed_view AS
SELECT
  p.id AS post_id,
  p.workspace_id,
  p.content,
  p.image_url,
  p.created_at,
  u.id AS user_id,
  u.username,
  u.display_name,
  u.avatar_url,
  COUNT(DISTINCT l.user_id)::int AS like_count,
  COUNT(DISTINCT c.id)::int AS comment_count
FROM posts p
JOIN users u ON u.id = p.user_id
LEFT JOIN likes l ON l.post_id = p.id
LEFT JOIN comments c ON c.post_id = p.id
GROUP BY p.id, p.workspace_id, p.content, p.image_url, p.created_at, u.id, u.username, u.display_name, u.avatar_url;

CREATE OR REPLACE VIEW user_stats_view AS
SELECT
  u.id AS user_id,
  u.username,
  COUNT(DISTINCT p.id)::int AS post_count,
  COUNT(DISTINCT f1.follower_id)::int AS follower_count,
  COUNT(DISTINCT f2.following_id)::int AS following_count,
  u.workspace_id
FROM users u
LEFT JOIN posts p ON p.user_id = u.id
LEFT JOIN follows f1 ON f1.following_id = u.id
LEFT JOIN follows f2 ON f2.follower_id = u.id
GROUP BY u.id, u.username, u.workspace_id;
