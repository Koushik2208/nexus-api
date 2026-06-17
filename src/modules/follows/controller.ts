import type { Request, Response } from "express";
import * as followService from "./service.js";
import * as notificationService from "../notifications/service.js";
import { ValidationError, NotFoundError, ConflictError } from "../../errors.js";

export async function follow(req: Request, res: Response) {
  const followingId = Number(req.params.userId);
  if (Number.isNaN(followingId)) {
    throw new ValidationError("userId must be a number");
  }

  const { follower_id } = req.body;
  if (!follower_id || typeof follower_id !== "number") {
    throw new ValidationError("follower_id is required");
  }
  if (follower_id === followingId) {
    throw new ValidationError("cannot follow yourself");
  }

  try {
    const result = await followService.createFollow({
      follower_id,
      following_id: followingId,
    });

    await notificationService.createNotification({
      user_id: followingId,
      actor_id: follower_id,
      type: "follow",
      post_id: null,
    });

    res.status(201).json(result);
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as any).code === "23505") {
      throw new ConflictError("already following");
    }
    throw err;
  }
}

export async function unfollow(req: Request, res: Response) {
  const followingId = Number(req.params.userId);
  if (Number.isNaN(followingId)) {
    throw new ValidationError("userId must be a number");
  }

  const { follower_id } = req.body;
  if (!follower_id || typeof follower_id !== "number") {
    throw new ValidationError("follower_id is required");
  }

  const result = await followService.deleteFollow(follower_id, followingId);
  if (!result) {
    throw new NotFoundError("follow not found");
  }
  res.status(204).send();
}
