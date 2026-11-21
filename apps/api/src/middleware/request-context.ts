import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
declare module "express-serve-static-core" {
  interface Request {
    requestId: string;
  }
}
export function requestContext(req: Request, res: Response, next: NextFunction) {
  const supplied = req.header("x-request-id");
  req.requestId = supplied && /^[a-zA-Z0-9_-]{8,64}$/.test(supplied) ? supplied : randomUUID();
  res.setHeader("x-request-id", req.requestId);
  const started = performance.now();
  res.on("finish", () => {
    const route = typeof req.route?.path === "string" ? req.baseUrl + req.route.path : "/unmatched";
    process.stdout.write(
      JSON.stringify({
        level: "info",
        event: "http_request",
        requestId: req.requestId,
        method: req.method,
        route,
        status: res.statusCode,
        durationMs: Math.round((performance.now() - started) * 100) / 100,
      }) + "\n",
    );
  });
  next();
}
