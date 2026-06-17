import pool from "../../db/pool.js";
import type { User, UserStats } from "../../types/index.js";

export async function createUser(
  data: Omit<User, "id" | "created_at">,
): Promise<User> {
  const { workspace_id, username, display_name, avatar_url, bio } = data;
  const result = await pool.query<User>(
    "INSERT INTO users (workspace_id, username, display_name, avatar_url, bio) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [workspace_id, username, display_name, avatar_url, bio],
  );
  return result.rows[0]!;
}

interface ListOptions {
  limit: number;
  cursor: number | undefined;
}

export async function getUsers(workspaceId: number, options: ListOptions): Promise<User[]> {
  const { limit, cursor } = options;

  if (cursor !== undefined) {
    const result = await pool.query<User>(
      "SELECT * FROM users WHERE workspace_id = $1 AND id > $2 ORDER BY id ASC LIMIT $3",
      [workspaceId, cursor, limit],
    );
    return result.rows;
  }

  const result = await pool.query<User>(
    "SELECT * FROM users WHERE workspace_id = $1 ORDER BY id ASC LIMIT $2",
    [workspaceId, limit],
  );
  return result.rows;
}

export async function getUserById(id: number, workspaceId: number): Promise<User | null> {
  const result = await pool.query<User>(
    "SELECT * FROM users WHERE id = $1 AND workspace_id = $2",
    [id, workspaceId],
  );
  return result.rows[0] ?? null;
}

export async function getUserStats(id: number, workspaceId: number): Promise<UserStats | null> {
  const result = await pool.query<UserStats>(
    "SELECT * FROM user_stats_view WHERE user_id = $1 AND workspace_id = $2",
    [id, workspaceId],
  );
  return result.rows[0] ?? null;
}
