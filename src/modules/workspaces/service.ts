import pool from "../../db/pool.js";
import type { Workspace } from "../../types/index.js";

export async function createWorkspace(
  data: Omit<Workspace, "id" | "created_at">
): Promise<Workspace> {
  const { name } = data;
  const result = await pool.query<Workspace>(
    "INSERT INTO workspaces (name) VALUES ($1) RETURNING *",
    [name]
  );
  return result.rows[0]!;
}

export async function getWorkspaces(): Promise<Workspace[]> {
  const result = await pool.query<Workspace>(
    "SELECT * FROM workspaces ORDER BY id"
  );
  return result.rows;
}

export async function getWorkspaceById(id: number): Promise<Workspace | null> {
  const result = await pool.query<Workspace>(
    "SELECT * FROM workspaces WHERE id = $1",
    [id]
  );
  return result.rows[0] ?? null;
}

export async function resetWorkspace(workspaceId: number): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE workspace_id = $1)",
      [workspaceId]
    );
    await client.query(
      "DELETE FROM likes WHERE post_id IN (SELECT id FROM posts WHERE workspace_id = $1)",
      [workspaceId]
    );
    await client.query(
      "DELETE FROM comments WHERE post_id IN (SELECT id FROM posts WHERE workspace_id = $1)",
      [workspaceId]
    );
    await client.query(
      "DELETE FROM follows WHERE follower_id IN (SELECT id FROM users WHERE workspace_id = $1) OR following_id IN (SELECT id FROM users WHERE workspace_id = $1)",
      [workspaceId]
    );
    await client.query("DELETE FROM posts WHERE workspace_id = $1", [workspaceId]);
    await client.query("DELETE FROM users WHERE workspace_id = $1", [workspaceId]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
