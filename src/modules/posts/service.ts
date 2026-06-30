import pool from "../../db/pool.js";
import type { Post, FeedItem } from "../../types/index.js";

export async function createPost(
  data: Omit<Post, "id" | "created_at">,
): Promise<FeedItem> {
  const { workspace_id, user_id, content, image_url } = data;
  const inserted = await pool.query<{ id: number }>(
    "INSERT INTO posts (workspace_id, user_id, content, image_url) VALUES ($1, $2, $3, $4) RETURNING id",
    [workspace_id, user_id, content, image_url],
  );
  const postId = inserted.rows[0]!.id;
  const result = await pool.query<FeedItem>(
    "SELECT fv.*, NULL::boolean AS liked_by_me FROM feed_view fv WHERE fv.post_id = $1",
    [postId],
  );
  return result.rows[0]!;
}

export async function getPostById(id: number, workspaceId: number): Promise<FeedItem | null> {
  const result = await pool.query<FeedItem>(
    "SELECT fv.*, NULL::boolean AS liked_by_me FROM feed_view fv WHERE fv.post_id = $1 AND fv.workspace_id = $2",
    [id, workspaceId],
  );
  return result.rows[0] ?? null;
}

export async function getPostsByUserId(userId: number, workspaceId: number): Promise<FeedItem[]> {
  const result = await pool.query<FeedItem>(
    "SELECT fv.*, NULL::boolean AS liked_by_me FROM feed_view fv WHERE fv.user_id = $1 AND fv.workspace_id = $2 ORDER BY fv.post_id DESC",
    [userId, workspaceId],
  );
  return result.rows;
}

export async function deletePost(id: number, workspaceId: number): Promise<Post | null> {
  const result = await pool.query<Post>(
    "DELETE FROM posts WHERE id = $1 AND workspace_id = $2 RETURNING *",
    [id, workspaceId],
  );
  return result.rows[0] ?? null;
}
