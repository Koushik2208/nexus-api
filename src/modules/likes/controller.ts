import type { Request, Response } from "express";
import * as likeService from "./service.js";
import * as postService from "../posts/service.js";
import * as notificationService from "../notifications/service.js";
import { ValidationError, NotFoundError, ConflictError } from "../../errors.js";

export async function like(req: Request, res: Response) {
  const postId = Number(req.params.postId);
  if (Number.isNaN(postId)) {
    throw new ValidationError("postId must be a number");
  }

  const { user_id } = req.body;
  if (!user_id || typeof user_id !== "number") {
    throw new ValidationError("user_id is required");
  }

  try {
    const result = await likeService.createLike({ post_id: postId, user_id });

    const post = await postService.getPostById(postId, req.workspace_id!);
    if (post && post.user_id !== user_id) {
      await notificationService.createNotification({
        user_id: post.user_id,
        actor_id: user_id,
        type: "like",
        post_id: postId,
      });
    }

    res.status(201).json(result);
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as any).code === "23505") {
      throw new ConflictError("already liked");
    }
    throw err;
  }
}

export async function unlike(req: Request, res: Response) {
  const postId = Number(req.params.postId);
  if (Number.isNaN(postId)) {
    throw new ValidationError("postId must be a number");
  }

  const { user_id } = req.body;
  if (!user_id || typeof user_id !== "number") {
    throw new ValidationError("user_id is required");
  }

  const result = await likeService.deleteLike(postId, user_id);
  if (!result) {
    throw new NotFoundError("like not found");
  }
  res.status(204).send();
}
