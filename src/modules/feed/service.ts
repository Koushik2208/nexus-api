import pool from "../../db/pool.js";
import type { FeedItem } from "../../types/index.js";

interface FeedOptions {
  limit: number;
  cursor: number | undefined;
  sort: "newest" | "oldest";
  userId?: number | undefined;
}

export async function getFeed(
  workspaceId: number,
  options: FeedOptions,
): Promise<FeedItem[]> {
  const { limit, cursor, sort, userId } = options;
  const direction = sort === "oldest" ? "ASC" : "DESC";
  const cursorOp = sort === "oldest" ? ">" : "<";

  const params: number[] = [workspaceId];
  const conditions: string[] = ["workspace_id = $1"];

  if (cursor !== undefined) {
    params.push(cursor);
    conditions.push(`post_id ${cursorOp} $${params.length}`);
  }

  if (userId !== undefined) {
    params.push(userId);
    conditions.push(`user_id IN (SELECT following_id FROM follows WHERE follower_id = $${params.length})`);
  }

  params.push(limit);
  const sql = `SELECT * FROM feed_view WHERE ${conditions.join(" AND ")} ORDER BY post_id ${direction} LIMIT $${params.length}`;

  const result = await pool.query<FeedItem>(sql, params);
  return result.rows;
}
