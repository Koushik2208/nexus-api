import type { Request, Response, NextFunction } from "express";
import * as apiKeyService from "../modules/apiKeys/service.js";
import { UnauthorizedError } from "../errors.js";

export async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const key = req.header("x-api-key");
  if (!key) {
    throw new UnauthorizedError("x-api-key header is required");
  }

  const apiKey = await apiKeyService.getApiKeyByKey(key);
  if (!apiKey) {
    throw new UnauthorizedError("invalid api key");
  }

  req.workspace_id = apiKey.workspace_id;
  next();
}
