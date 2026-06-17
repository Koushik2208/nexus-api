import pool from "../../db/pool.js";
import type { Comment } from "../../types/index.js";

export async function createComment(
  data: Omit<Comment, "id" | "created_at">,
): Promise<Comment> {
  const { post_id, user_id, content } = data;
  const result = await pool.query<Comment>(
    "INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING *",
    [post_id, user_id, content],
  );
  return result.rows[0]!;
}

interface ListOptions {
  limit: number;
  cursor: number | undefined;
}

export async function getCommentsByPostId(postId: number, options: ListOptions): Promise<Comment[]> {
  const { limit, cursor } = options;

  if (cursor !== undefined) {
    const result = await pool.query<Comment>(
      "SELECT * FROM comments WHERE post_id = $1 AND id > $2 ORDER BY id ASC LIMIT $3",
      [postId, cursor, limit],
    );
    return result.rows;
  }

  const result = await pool.query<Comment>(
    "SELECT * FROM comments WHERE post_id = $1 ORDER BY id ASC LIMIT $2",
    [postId, limit],
  );
  return result.rows;
}
