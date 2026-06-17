import type { Request, Response } from "express";
import * as searchService from "./service.js";
import { parsePagination } from "../../utils/pagination.js";
import { ValidationError } from "../../errors.js";

export async function search(req: Request, res: Response) {
  const workspaceId = req.workspace_id!;
  const q = req.query.q;

  if (typeof q !== "string" || q.trim() === "") {
    throw new ValidationError("q is required");
  }

  const pagination = parsePagination(req.query);
  if ("error" in pagination) {
    throw new ValidationError(pagination.error);
  }

  const [users, posts] = await Promise.all([
    searchService.searchUsers(workspaceId, q, pagination.limit),
    searchService.searchPosts(workspaceId, q, pagination.limit),
  ]);

  res.status(200).json({ users, posts });
}
