import pool from "../../db/pool.js";
import type { Post } from "../../types/index.js";

export async function createPost(
  data: Omit<Post, "id" | "created_at">,
): Promise<Post> {
  const { workspace_id, user_id, content, image_url } = data;
  const result = await pool.query<Post>(
    "INSERT INTO posts (workspace_id, user_id, content, image_url) VALUES ($1, $2, $3, $4) RETURNING *",
    [workspace_id, user_id, content, image_url],
  );
  return result.rows[0]!;
}

export async function getPostById(id: number, workspaceId: number): Promise<Post | null> {
  const result = await pool.query<Post>(
    "SELECT * FROM posts WHERE id = $1 AND workspace_id = $2",
    [id, workspaceId],
  );
  return result.rows[0] ?? null;
}

export async function getPostsByUserId(userId: number, workspaceId: number): Promise<Post[]> {
  const result = await pool.query<Post>(
    "SELECT * FROM posts WHERE user_id = $1 AND workspace_id = $2 ORDER BY id DESC",
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
