import pool from "../../db/pool.js";
import type { FeedItem } from "../../types/index.js";

interface FeedOptions {
  limit: number;
  cursor: number | undefined;
  sort: "newest" | "oldest";
  userId?: number | undefined;
  viewerId?: number | undefined;
}

export async function getFeed(
  workspaceId: number,
  options: FeedOptions,
): Promise<FeedItem[]> {
  const { limit, cursor, sort, userId, viewerId } = options;
  const direction = sort === "oldest" ? "ASC" : "DESC";
  const cursorOp = sort === "oldest" ? ">" : "<";

  const params: number[] = [workspaceId];
  const conditions: string[] = ["fv.workspace_id = $1"];

  if (cursor !== undefined) {
    params.push(cursor);
    conditions.push(`fv.post_id ${cursorOp} $${params.length}`);
  }

  if (userId !== undefined) {
    params.push(userId);
    conditions.push(`fv.user_id IN (SELECT following_id FROM follows WHERE follower_id = $${params.length})`);
  }

  let from: string;
  let select: string;

  if (viewerId !== undefined) {
    params.push(viewerId);
    from = `feed_view fv LEFT JOIN likes l ON l.post_id = fv.post_id AND l.user_id = $${params.length}`;
    select = `fv.*, (l.user_id IS NOT NULL) AS liked_by_me`;
  } else {
    from = `feed_view fv`;
    select = `fv.*, NULL::boolean AS liked_by_me`;
  }

  params.push(limit);
  const sql = `SELECT ${select} FROM ${from} WHERE ${conditions.join(" AND ")} ORDER BY fv.post_id ${direction} LIMIT $${params.length}`;

  const result = await pool.query<FeedItem>(sql, params);
  return result.rows;
}
