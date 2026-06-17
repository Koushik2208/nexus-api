import type { Request, Response } from "express";
import * as commentService from "./service.js";
import * as postService from "../posts/service.js";
import * as notificationService from "../notifications/service.js";
import { parsePagination } from "../../utils/pagination.js";
import { ValidationError } from "../../errors.js";

export async function create(req: Request, res: Response) {
  const postId = Number(req.params.postId);
  if (Number.isNaN(postId)) {
    throw new ValidationError("postId must be a number");
  }

  const { user_id, content } = req.body;
  if (!user_id || typeof user_id !== "number") {
    throw new ValidationError("user_id is required");
  }
  if (!content || typeof content !== "string") {
    throw new ValidationError("content is required");
  }

  const comment = await commentService.createComment({
    post_id: postId,
    user_id,
    content,
  });

  const post = await postService.getPostById(postId, req.workspace_id!);
  if (post && post.user_id !== user_id) {
    await notificationService.createNotification({
      user_id: post.user_id,
      actor_id: user_id,
      type: "comment",
      post_id: postId,
    });
  }

  res.status(201).json(comment);
}

export async function list(req: Request, res: Response) {
  const postId = Number(req.params.postId);
  if (Number.isNaN(postId)) {
    throw new ValidationError("postId must be a number");
  }

  const pagination = parsePagination(req.query);
  if ("error" in pagination) {
    throw new ValidationError(pagination.error);
  }

  const comments = await commentService.getCommentsByPostId(postId, pagination);
  const nextCursor = comments.length === pagination.limit ? comments[comments.length - 1]!.id : null;

  res.status(200).json({ comments, next_cursor: nextCursor });
}
