import type { Request, Response } from "express";
import * as postService from "./service.js";
import { ValidationError, NotFoundError } from "../../errors.js";

export async function create(req: Request, res: Response) {
  const workspace_id = req.workspace_id!;
  const { user_id, content, image_url } = req.body;

  if (!user_id || typeof user_id !== "number") {
    throw new ValidationError("user_id is required");
  }
  if (!content || typeof content !== "string") {
    throw new ValidationError("content is required");
  }

  const post = await postService.createPost({
    workspace_id,
    user_id,
    content,
    image_url: image_url ?? null,
  });
  res.status(201).json(post);
}

export async function getById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new ValidationError("id must be a number");
  }
  const post = await postService.getPostById(id, req.workspace_id!);
  if (!post) {
    throw new NotFoundError("post not found");
  }
  res.status(200).json(post);
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new ValidationError("id must be a number");
  }
  const post = await postService.deletePost(id, req.workspace_id!);
  if (!post) {
    throw new NotFoundError("post not found");
  }
  res.status(204).send();
}
