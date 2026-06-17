import "express";

declare global {
  namespace Express {
    interface Request {
      workspace_id?: number;
    }
  }
}
