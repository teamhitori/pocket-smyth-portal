import { Hono } from "hono";
import { authMiddleware } from "./middleware/auth.js";
import { containers } from "./routes/containers.js";
import { compose } from "./routes/compose.js";
import { health } from "./routes/health.js";

const app = new Hono();

// Health check (no auth required)
app.route("/", health);

// All other routes require shared secret auth
app.use("/*", authMiddleware);
app.route("/containers", containers);
app.route("/compose", compose);

export { app };
