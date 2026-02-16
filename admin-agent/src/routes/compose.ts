import { Hono } from "hono";

export const compose = new Hono();

/**
 * POST /up — Provision a new user stack from template
 * Body: { username: string }
 */
compose.post("/up", async (c) => {
  const body = await c.req.json<{ username: string }>();
  // TODO: Find next available port (scan Docker containers)
  // TODO: docker compose up for user stack
  // TODO: Write Traefik file provider YAML for {username}.* route
  return c.json({ stub: true, username: body.username, endpoint: "compose/up" });
});

/**
 * POST /down — Tear down a user stack
 * Body: { username: string }
 */
compose.post("/down", async (c) => {
  const body = await c.req.json<{ username: string }>();
  // TODO: docker compose down for user stack
  // TODO: Remove Traefik file provider entry
  return c.json({ stub: true, username: body.username, endpoint: "compose/down" });
});
