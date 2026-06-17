import pool from "../../db/pool.js";
import type { FeedItem } from "../../types/index.js";

interface FeedOptions {
  limit: number;
  cursor: number | undefined;
  sort: "newest" | "oldest";
}

export async function getFeed(
  workspaceId: number,
  options: FeedOptions,
): Promise<FeedItem[]> {
  const { limit, cursor, sort } = options;
  const direction = sort === "oldest" ? "ASC" : "DESC";
  const cursorOp = sort === "oldest" ? ">" : "<";

  if (cursor !== undefined) {
    const result = await pool.query<FeedItem>(
      `SELECT * FROM feed_view WHERE workspace_id = $1 AND post_id ${cursorOp} $2 ORDER BY post_id ${direction} LIMIT $3`,
      [workspaceId, cursor, limit],
    );
    return result.rows;
  }

  const result = await pool.query<FeedItem>(
    `SELECT * FROM feed_view WHERE workspace_id = $1 ORDER BY post_id ${direction} LIMIT $2`,
    [workspaceId, limit],
  );
  return result.rows;
}
