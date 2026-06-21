import pool from "../../db/pool.js";

type ImportResult = { imported: number; skipped: number; errors: string[] };
type Row = Record<string, unknown>;

function str(val: unknown): string {
  return String(val ?? "").trim();
}

export async function importUsers(rows: Row[], workspaceId: number): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2;
    const username = str(row.username);

    if (!username) {
      result.skipped++;
      result.errors.push(`row ${rowNum}: missing username`);
      continue;
    }

    try {
      await pool.query(
        "INSERT INTO users (workspace_id, username, display_name, avatar_url, bio) VALUES ($1, $2, $3, $4, $5)",
        [workspaceId, username, row.display_name ?? null, row.avatar_url ?? null, row.bio ?? null]
      );
      result.imported++;
    } catch (err: any) {
      result.skipped++;
      result.errors.push(
        err.code === "23505"
          ? `row ${rowNum}: username '${username}' already exists`
          : `row ${rowNum}: ${err.message}`
      );
    }
  }

  return result;
}

export async function importPosts(rows: Row[], workspaceId: number): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  const usernames = [...new Set(rows.map((r) => str(r.username)).filter(Boolean))];
  const { rows: users } = await pool.query(
    "SELECT id, username FROM users WHERE workspace_id = $1 AND username = ANY($2)",
    [workspaceId, usernames]
  );
  const userMap = new Map<string, number>(users.map((u) => [u.username, u.id]));

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2;
    const username = str(row.username);
    const content = str(row.content);

    if (!username) { result.skipped++; result.errors.push(`row ${rowNum}: missing username`); continue; }
    if (!content) { result.skipped++; result.errors.push(`row ${rowNum}: missing content`); continue; }

    const userId = userMap.get(username);
    if (!userId) { result.skipped++; result.errors.push(`row ${rowNum}: username '${username}' not found`); continue; }

    try {
      await pool.query(
        "INSERT INTO posts (workspace_id, user_id, content, image_url) VALUES ($1, $2, $3, $4)",
        [workspaceId, userId, content, row.image_url ?? null]
      );
      result.imported++;
    } catch (err: any) {
      result.skipped++;
      result.errors.push(`row ${rowNum}: ${err.message}`);
    }
  }

  return result;
}

export async function importComments(rows: Row[], workspaceId: number): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  const usernames = [...new Set(rows.map((r) => str(r.username)).filter(Boolean))];
  const { rows: users } = await pool.query(
    "SELECT id, username FROM users WHERE workspace_id = $1 AND username = ANY($2)",
    [workspaceId, usernames]
  );
  const userMap = new Map<string, number>(users.map((u) => [u.username, u.id]));

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2;
    const username = str(row.username);
    const content = str(row.content);
    const postId = Number(row.post_id);

    if (!username) { result.skipped++; result.errors.push(`row ${rowNum}: missing username`); continue; }
    if (!content) { result.skipped++; result.errors.push(`row ${rowNum}: missing content`); continue; }
    if (!postId || isNaN(postId)) { result.skipped++; result.errors.push(`row ${rowNum}: missing or invalid post_id`); continue; }

    const userId = userMap.get(username);
    if (!userId) { result.skipped++; result.errors.push(`row ${rowNum}: username '${username}' not found`); continue; }

    try {
      await pool.query(
        "INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3)",
        [postId, userId, content]
      );
      result.imported++;
    } catch (err: any) {
      result.skipped++;
      result.errors.push(
        err.code === "23503"
          ? `row ${rowNum}: post_id ${postId} not found`
          : `row ${rowNum}: ${err.message}`
      );
    }
  }

  return result;
}

export async function importLikes(rows: Row[], workspaceId: number): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  const usernames = [...new Set(rows.map((r) => str(r.username)).filter(Boolean))];
  const { rows: users } = await pool.query(
    "SELECT id, username FROM users WHERE workspace_id = $1 AND username = ANY($2)",
    [workspaceId, usernames]
  );
  const userMap = new Map<string, number>(users.map((u) => [u.username, u.id]));

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2;
    const username = str(row.username);
    const postId = Number(row.post_id);

    if (!username) { result.skipped++; result.errors.push(`row ${rowNum}: missing username`); continue; }
    if (!postId || isNaN(postId)) { result.skipped++; result.errors.push(`row ${rowNum}: missing or invalid post_id`); continue; }

    const userId = userMap.get(username);
    if (!userId) { result.skipped++; result.errors.push(`row ${rowNum}: username '${username}' not found`); continue; }

    try {
      await pool.query("INSERT INTO likes (post_id, user_id) VALUES ($1, $2)", [postId, userId]);
      result.imported++;
    } catch (err: any) {
      result.skipped++;
      if (err.code === "23505") result.errors.push(`row ${rowNum}: '${username}' already liked post ${postId}`);
      else if (err.code === "23503") result.errors.push(`row ${rowNum}: post_id ${postId} not found`);
      else result.errors.push(`row ${rowNum}: ${err.message}`);
    }
  }

  return result;
}

export async function importFollows(rows: Row[], workspaceId: number): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  const allUsernames = [...new Set([
    ...rows.map((r) => str(r.follower_username)),
    ...rows.map((r) => str(r.following_username)),
  ].filter(Boolean))];

  const { rows: users } = await pool.query(
    "SELECT id, username FROM users WHERE workspace_id = $1 AND username = ANY($2)",
    [workspaceId, allUsernames]
  );
  const userMap = new Map<string, number>(users.map((u) => [u.username, u.id]));

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2;
    const followerUsername = str(row.follower_username);
    const followingUsername = str(row.following_username);

    if (!followerUsername) { result.skipped++; result.errors.push(`row ${rowNum}: missing follower_username`); continue; }
    if (!followingUsername) { result.skipped++; result.errors.push(`row ${rowNum}: missing following_username`); continue; }

    const followerId = userMap.get(followerUsername);
    const followingId = userMap.get(followingUsername);

    if (!followerId) { result.skipped++; result.errors.push(`row ${rowNum}: follower '${followerUsername}' not found`); continue; }
    if (!followingId) { result.skipped++; result.errors.push(`row ${rowNum}: following '${followingUsername}' not found`); continue; }
    if (followerId === followingId) { result.skipped++; result.errors.push(`row ${rowNum}: cannot follow self`); continue; }

    try {
      await pool.query("INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)", [followerId, followingId]);
      result.imported++;
    } catch (err: any) {
      result.skipped++;
      result.errors.push(
        err.code === "23505"
          ? `row ${rowNum}: '${followerUsername}' already follows '${followingUsername}'`
          : `row ${rowNum}: ${err.message}`
      );
    }
  }

  return result;
}
