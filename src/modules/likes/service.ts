import pool from "../../db/pool.js";
import type { Like } from "../../types/index.js";

export async function createLike(
  data: Omit<Like, "created_at">,
): Promise<Like> {
  const { post_id, user_id } = data;
  const result = await pool.query<Like>(
    "INSERT INTO likes (post_id, user_id) VALUES ($1, $2) RETURNING *",
    [post_id, user_id],
  );
  return result.rows[0]!;
}

export async function deleteLike(
  postId: number,
  userId: number,
): Promise<Like | null> {
  const result = await pool.query<Like>(
    "DELETE FROM likes WHERE post_id = $1 AND user_id = $2 RETURNING *",
    [postId, userId],
  );
  return result.rows[0] ?? null;
}
