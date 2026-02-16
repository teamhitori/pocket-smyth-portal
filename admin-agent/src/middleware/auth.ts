import type { Context, Next } from "hono";

const ADMIN_AGENT_SECRET = process.env.ADMIN_AGENT_SECRET || "dev-secret";

/**
 * Shared secret auth middleware.
 * Expects: Authorization: Bearer <secret>
 * Only accepts requests from portal-net (Portal API routes).
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing Authorization header" }, 401);
  }

  const token = authHeader.slice(7);
  if (token !== ADMIN_AGENT_SECRET) {
    return c.json({ error: "Invalid secret" }, 403);
  }

  await next();
}
