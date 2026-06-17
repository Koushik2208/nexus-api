import pool from "../../db/pool.js";
import type { Notification } from "../../types/index.js";

export async function createNotification(
  data: Omit<Notification, "id" | "created_at" | "read_at">,
): Promise<Notification> {
  const { user_id, actor_id, type, post_id } = data;
  const result = await pool.query<Notification>(
    "INSERT INTO notifications (user_id, actor_id, type, post_id) VALUES ($1, $2, $3, $4) RETURNING *",
    [user_id, actor_id, type, post_id],
  );
  return result.rows[0]!;
}

interface ListOptions {
  limit: number;
  cursor: number | undefined;
}

export async function getNotificationsByUserId(userId: number, options: ListOptions): Promise<Notification[]> {
  const { limit, cursor } = options;

  if (cursor !== undefined) {
    const result = await pool.query<Notification>(
      "SELECT * FROM notifications WHERE user_id = $1 AND id < $2 ORDER BY id DESC LIMIT $3",
      [userId, cursor, limit],
    );
    return result.rows;
  }

  const result = await pool.query<Notification>(
    "SELECT * FROM notifications WHERE user_id = $1 ORDER BY id DESC LIMIT $2",
    [userId, limit],
  );
  return result.rows;
}

export async function markAsRead(id: number): Promise<Notification | null> {
  const result = await pool.query<Notification>(
    "UPDATE notifications SET read_at = COALESCE(read_at, now()) WHERE id = $1 RETURNING *",
    [id],
  );
  return result.rows[0] ?? null;
}
