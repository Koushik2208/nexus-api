import type { Request, Response } from "express";
import * as feedService from "./service.js";
import { parsePagination } from "../../utils/pagination.js";
import { ValidationError } from "../../errors.js";

export async function list(req: Request, res: Response) {
  const workspaceId = req.workspace_id!;

  const pagination = parsePagination(req.query);
  if ("error" in pagination) {
    throw new ValidationError(pagination.error);
  }
  const { limit, cursor } = pagination;

  const sort = req.query.sort === "oldest" ? "oldest" : "newest";

  const rawUserId = req.query.user_id;
  const userId = rawUserId !== undefined ? Number(rawUserId) : undefined;
  if (userId !== undefined && (!Number.isInteger(userId) || userId <= 0)) {
    throw new ValidationError("user_id must be a positive integer");
  }

  const rawViewerId = req.query.viewer_id;
  const viewerId = rawViewerId !== undefined ? Number(rawViewerId) : undefined;
  if (viewerId !== undefined && (!Number.isInteger(viewerId) || viewerId <= 0)) {
    throw new ValidationError("viewer_id must be a positive integer");
  }

  const posts = await feedService.getFeed(workspaceId, { limit, cursor, sort, userId, viewerId });
  const nextCursor = posts.length === limit ? posts[posts.length - 1]!.post_id : null;

  res.status(200).json({ posts, next_cursor: nextCursor });
}
