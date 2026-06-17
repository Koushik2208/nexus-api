import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors.js";

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Postgres unique violation
  if (err instanceof Error && "code" in err && (err as any).code === "23505") {
    return res.status(409).json({ error: "resource already exists" });
  }

  // Postgres foreign key violation
  if (err instanceof Error && "code" in err && (err as any).code === "23503") {
    return res.status(400).json({ error: "referenced resource does not exist" });
  }

  // Malformed JSON body (Express built-in parser throws this)
  if (err instanceof SyntaxError && "status" in err && (err as any).status === 400) {
    return res.status(400).json({ error: "invalid JSON body" });
  }

  console.error(err);
  res.status(500).json({ error: "internal server error" });
}
