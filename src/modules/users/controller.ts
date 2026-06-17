import type { Request, Response } from "express";
import * as userService from "./service.js";
import * as followService from "../follows/service.js";
import * as postService from "../posts/service.js";
import { parsePagination } from "../../utils/pagination.js";
import { ValidationError, NotFoundError } from "../../errors.js";

export async function create(req: Request, res: Response) {
  const workspace_id = req.workspace_id!;
  const { username, display_name, avatar_url, bio } = req.body;

  if (!username || typeof username !== "string") {
    throw new ValidationError("username is required");
  }

  const user = await userService.createUser({
    workspace_id,
    username,
    display_name: display_name ?? null,
    avatar_url: avatar_url ?? null,
    bio: bio ?? null,
  });
  res.status(201).json(user);
}

export async function list(req: Request, res: Response) {
  const pagination = parsePagination(req.query);
  if ("error" in pagination) {
    throw new ValidationError(pagination.error);
  }

  const users = await userService.getUsers(req.workspace_id!, pagination);
  const nextCursor = users.length === pagination.limit ? users[users.length - 1]!.id : null;

  res.status(200).json({ users, next_cursor: nextCursor });
}

export async function getById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new ValidationError("id must be a number");
  }
  const user = await userService.getUserById(id, req.workspace_id!);
  if (!user) {
    throw new NotFoundError("user not found");
  }
  res.status(200).json(user);
}

export async function posts(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new ValidationError("id must be a number");
  }
  const userPosts = await postService.getPostsByUserId(id, req.workspace_id!);
  res.status(200).json(userPosts);
}

export async function stats(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new ValidationError("id must be a number");
  }
  const userStats = await userService.getUserStats(id, req.workspace_id!);
  if (!userStats) {
    throw new NotFoundError("user not found");
  }
  res.status(200).json(userStats);
}

export async function followers(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new ValidationError("id must be a number");
  }
  const users = await followService.getFollowers(id, req.workspace_id!);
  res.status(200).json(users);
}

export async function following(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new ValidationError("id must be a number");
  }
  const users = await followService.getFollowing(id, req.workspace_id!);
  res.status(200).json(users);
}
