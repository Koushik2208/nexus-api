import pool from "../../db/pool.js";
import type { Follow, User } from "../../types/index.js";

export async function createFollow(
  data: Omit<Follow, "created_at">,
): Promise<Follow> {
  const { follower_id, following_id } = data;
  const result = await pool.query<Follow>(
    "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) RETURNING *",
    [follower_id, following_id],
  );
  return result.rows[0]!;
}

export async function deleteFollow(
  followerId: number,
  followingId: number,
): Promise<Follow | null> {
  const result = await pool.query<Follow>(
    "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2 RETURNING *",
    [followerId, followingId],
  );
  return result.rows[0] ?? null;
}

export async function getFollowers(userId: number, workspaceId: number): Promise<User[]> {
  const result = await pool.query<User>(
    `SELECT u.* FROM follows f
     JOIN users u ON u.id = f.follower_id
     JOIN users target ON target.id = f.following_id
     WHERE f.following_id = $1 AND target.workspace_id = $2
     ORDER BY u.id`,
    [userId, workspaceId],
  );
  return result.rows;
}

export async function getFollowing(userId: number, workspaceId: number): Promise<User[]> {
  const result = await pool.query<User>(
    `SELECT u.* FROM follows f
     JOIN users u ON u.id = f.following_id
     JOIN users target ON target.id = f.follower_id
     WHERE f.follower_id = $1 AND target.workspace_id = $2
     ORDER BY u.id`,
    [userId, workspaceId],
  );
  return result.rows;
}
