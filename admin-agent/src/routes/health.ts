import { Hono } from "hono";

export const health = new Hono();

/**
 * GET /health — Health check (no auth required)
 */
health.get("/health", (c) => {
  return c.json({ status: "ok", service: "admin-agent" });
});
