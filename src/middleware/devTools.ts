import type { Request, Response, NextFunction } from "express";

function makeEmpty(body: unknown): unknown {
  if (Array.isArray(body)) return [];
  if (body !== null && typeof body === "object") {
    return Object.fromEntries(
      Object.entries(body as Record<string, unknown>).map(([k, v]) => [
        k,
        Array.isArray(v) ? [] : v,
      ])
    );
  }
  return body;
}

function makePartial(body: unknown): unknown {
  if (Array.isArray(body)) return body.slice(0, 2);
  if (body !== null && typeof body === "object") {
    return Object.fromEntries(
      Object.entries(body as Record<string, unknown>).map(([k, v]) => [
        k,
        Array.isArray(v) ? v.slice(0, 2) : v,
      ])
    );
  }
  return body;
}

export async function devTools(req: Request, res: Response, next: NextFunction) {
  // ?delay=ms — simulate slow network (capped at 10s)
  const delay = Number(req.query.delay);
  if (!Number.isNaN(delay) && delay > 0) {
    await new Promise(resolve => setTimeout(resolve, Math.min(delay, 10000)));
  }

  // ?error=statusCode — force an error response
  const errorCode = Number(req.query.error);
  if (!Number.isNaN(errorCode) && errorCode >= 400 && errorCode < 600) {
    return res.status(errorCode).json({ error: `forced error ${errorCode}` });
  }

  // ?empty=true or ?partial=true — intercept res.json and transform the body
  if (req.query.empty === "true" || req.query.partial === "true") {
    const originalJson = res.json.bind(res);
    (res as any).json = function (body?: unknown) {
      let out = body;
      if (req.query.empty === "true") out = makeEmpty(out);
      if (req.query.partial === "true") out = makePartial(out);
      return originalJson(out);
    };
  }

  next();
}
