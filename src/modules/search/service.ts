import pool from "../../db/pool.js";
import type { User, Post } from "../../types/index.js";

export async function searchUsers(workspaceId: number, q: string, limit: number): Promise<User[]> {
  const result = await pool.query<User>(
    `SELECT * FROM users WHERE workspace_id = $1 AND (username ILIKE $2 OR display_name ILIKE $2) ORDER BY id LIMIT $3`,
    [workspaceId, `%${q}%`, limit],
  );
  return result.rows;
}

export async function searchPosts(workspaceId: number, q: string, limit: number): Promise<Post[]> {
  const result = await pool.query<Post>(
    `SELECT * FROM posts WHERE workspace_id = $1 AND content ILIKE $2 ORDER BY id DESC LIMIT $3`,
    [workspaceId, `%${q}%`, limit],
  );
  return result.rows;
}
