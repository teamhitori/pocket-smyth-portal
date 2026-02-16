import { Hono } from "hono";
import { getDocker } from "../docker.js";

export const containers = new Hono();

/**
 * GET / — List all user containers with status
 */
containers.get("/", async (c) => {
  // TODO: Filter to user containers only (by naming convention)
  const docker = getDocker();
  const containerList = await docker.listContainers({ all: true });
  return c.json(containerList);
});

/**
 * GET /:name/stats — CPU, memory, storage for a container
 */
containers.get("/:name/stats", async (c) => {
  const name = c.req.param("name");
  // TODO: Get container stats via dockerode
  return c.json({ stub: true, container: name, endpoint: "stats" });
});

/**
 * POST /:name/restart — Restart a user's stack
 */
containers.post("/:name/restart", async (c) => {
  const name = c.req.param("name");
  // TODO: Restart container via dockerode
  return c.json({ stub: true, container: name, endpoint: "restart" });
});

/**
 * POST /:name/stop — Stop a user's stack
 */
containers.post("/:name/stop", async (c) => {
  const name = c.req.param("name");
  // TODO: Stop container via dockerode
  return c.json({ stub: true, container: name, endpoint: "stop" });
});
