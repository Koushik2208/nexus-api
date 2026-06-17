import type { Request, Response } from "express";
import * as workspaceService from "./service.js";
import * as apiKeyService from "../apiKeys/service.js";
import { ValidationError, NotFoundError, ForbiddenError } from "../../errors.js";

export async function create(req: Request, res: Response) {
  const { name } = req.body;
  if (!name || typeof name !== "string") {
    throw new ValidationError("name is required");
  }
  const workspace = await workspaceService.createWorkspace({ name });
  const apiKey = await apiKeyService.createApiKey(workspace.id);
  res.status(201).json({ ...workspace, api_key: apiKey.key });
}

export async function list(req: Request, res: Response) {
  const workspaces = await workspaceService.getWorkspaces();
  res.status(200).json(workspaces);
}

export async function getById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new ValidationError("id must be a number");
  }
  const workspace = await workspaceService.getWorkspaceById(id);
  if (!workspace) {
    throw new NotFoundError("workspace not found");
  }
  res.status(200).json(workspace);
}

export async function reset(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new ValidationError("id must be a number");
  }
  if (id !== req.workspace_id) {
    throw new ForbiddenError("cannot reset another workspace");
  }
  await workspaceService.resetWorkspace(id);
  res.status(200).json({ message: "workspace reset" });
}
