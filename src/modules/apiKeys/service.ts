import crypto from "node:crypto";
import pool from "../../db/pool.js";
import type { ApiKey } from "../../types/index.js";

function generateKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createApiKey(workspace_id: number): Promise<ApiKey> {
  const key = generateKey();
  const result = await pool.query<ApiKey>(
    "INSERT INTO api_keys (workspace_id, key) VALUES ($1, $2) RETURNING *",
    [workspace_id, key],
  );
  return result.rows[0]!;
}

export async function getApiKeyByKey(key: string): Promise<ApiKey | null> {
  const result = await pool.query<ApiKey>(
    "SELECT * FROM api_keys WHERE key = $1",
    [key],
  );
  return result.rows[0] ?? null;
}
