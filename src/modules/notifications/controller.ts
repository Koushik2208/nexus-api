import type { Request, Response } from "express";
import * as notificationService from "./service.js";
import { parsePagination } from "../../utils/pagination.js";
import { ValidationError, NotFoundError } from "../../errors.js";

export async function list(req: Request, res: Response) {
  const userId = Number(req.query.user_id);
  if (Number.isNaN(userId)) {
    throw new ValidationError("user_id is required");
  }

  const pagination = parsePagination(req.query);
  if ("error" in pagination) {
    throw new ValidationError(pagination.error);
  }

  const notifications = await notificationService.getNotificationsByUserId(userId, pagination);
  const nextCursor = notifications.length === pagination.limit ? notifications[notifications.length - 1]!.id : null;

  res.status(200).json({ notifications, next_cursor: nextCursor });
}

export async function markRead(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new ValidationError("id must be a number");
  }

  const notification = await notificationService.markAsRead(id);
  if (!notification) {
    throw new NotFoundError("notification not found");
  }
  res.status(200).json(notification);
}
