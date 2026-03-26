# Feature Requirements — E-13: Admin Agent Sidecar

> Build the secure intermediary between the portal and the Docker host — the Admin Agent accepts high-level requests ("provision this user") and translates them into container operations, keeping the Docker socket isolated from the web application.

| Field | Value |
|-------|-------|
| **Epic** | E-13 |
| **Release** | R3 — Admin + Provisioning on DEV |
| **Status** | Backlog |

---

## Feature Summary

| ID | Title | Type | Priority | SP | Status |
|----|-------|------|----------|----|--------|
| E13-F01 | Admin Agent HTTP Server | Non-Functional | Must | 5 | Backlog |
| E13-F02 | Container Lifecycle Endpoints | Functional | Must | 8 | Backlog |
| E13-F03 | Dynamic Port Allocation | Functional | Must | 5 | Backlog |
| E13-F04 | Traefik Route Management | Functional | Must | 5 | Backlog |
| E13-F05 | Admin Agent Docker Image | Non-Functional | Must | 3 | Backlog |
| E13-F06 | Portal-to-Agent Integration Tests | Non-Functional | Should | 5 | Backlog |

**Total Story Points: 31**

---

## Features

### E13-F01: Admin Agent HTTP Server

| Field | Value |
|-------|-------|
| **ID** | E13-F01 |
| **Epic** | E-13 |
| **Release** | R3 |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As the portal backend, I want the Admin Agent to be a secure HTTP service that only accepts requests from the portal so that container management operations cannot be triggered by unauthorised callers.

**Acceptance Criteria:**
- [ ] Hono HTTP server running in `admin-agent/src/`
- [ ] Shared-secret authentication middleware: all requests must include `Authorization: Bearer <ADMIN_AGENT_SECRET>`
- [ ] Requests without a valid secret receive 401 Unauthorized
- [ ] Server listens on port 8080, accessible only on the `portal-net` Docker network
- [ ] Health endpoint at `GET /health` (no auth required) returns 200 with uptime
- [ ] Structured JSON logging for all requests
- [ ] Graceful error handling (no stack traces in responses)

---

### E13-F02: Container Lifecycle Endpoints

| Field | Value |
|-------|-------|
| **ID** | E13-F02 |
| **Epic** | E-13 |
| **Release** | R3 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 8 |
| **Status** | Backlog |

**Description:**
As the portal backend, I want API endpoints on the Admin Agent for listing, inspecting, starting, stopping, and provisioning user containers so that all Docker operations are available through a clean HTTP interface.

**Acceptance Criteria:**
- [ ] `GET /containers` — lists all user containers with name, state, port, created date
  - Uses dockerode to query Docker daemon via mounted `/var/run/docker.sock`
  - Filters to user containers only (by naming convention or label)
- [ ] `GET /containers/:name/stats` — returns real-time stats for a specific container
  - CPU usage (%), memory usage (MB/limit), uptime
  - Returns 404 if container not found
- [ ] `POST /containers/:name/restart` — restarts a user's container stack
  - Executes `docker compose restart` equivalent via dockerode
  - Returns success/failure with descriptive message
- [ ] `POST /containers/:name/stop` — stops a user's container stack
  - Graceful stop with timeout, then force-kill
  - Returns success/failure
- [ ] `POST /compose/up` — provisions a new user stack from the template
  - Accepts `{ username, port }` in the request body
  - Creates the user's Docker Compose stack from template
  - Starts the stack and waits for healthy state
  - Returns the assigned port number
- [ ] `POST /compose/down` — tears down a user stack
  - Accepts `{ username }` in the request body
  - Stops and removes containers (data volumes preserved, per AD-4)
  - Returns success/failure

---

### E13-F03: Dynamic Port Allocation

| Field | Value |
|-------|-------|
| **ID** | E13-F03 |
| **Epic** | E-13 |
| **Release** | R3 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As the Admin Agent, I want to automatically discover the next available port when provisioning a new user so that port allocation is handled dynamically without a database.

**Acceptance Criteria:**
- [ ] Scans running Docker containers to determine which ports are in use
- [ ] Allocates the next available port from a defined range (e.g., 8001–8100)
- [ ] Prevents double-allocation race conditions (single-threaded allocation or locking)
- [ ] Returns the allocated port to the caller for storage in B2C
- [ ] Handles port exhaustion gracefully (returns a clear error when all ports are in use)
- [ ] No database dependency — state derived entirely from Docker (per AD-13)

---

### E13-F04: Traefik Route Management

| Field | Value |
|-------|-------|
| **ID** | E13-F04 |
| **Epic** | E-13 |
| **Release** | R3 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As the Admin Agent, I want to write and remove Traefik dynamic routing configuration when provisioning or deprovisioning users so that each user's subdomain is automatically routed to their container.

**Acceptance Criteria:**
- [ ] On provisioning (`/compose/up`): writes a Traefik file provider YAML to the dynamic config directory
  - Maps `{username}.teamhitori.com/agent/*` → user container at allocated port (DEV: `{username}.dev.teamhitori.com`)
  - File named `{username}.yml` in the Traefik dynamic config mount
- [ ] On deprovisioning (`/compose/down`): removes the user's Traefik config file
  - Route is immediately removed (Traefik watches the directory for changes)
- [ ] YAML syntax validated before writing
- [ ] Idempotent: re-running provisioning for an existing user updates rather than duplicates the config

---

### E13-F05: Admin Agent Docker Image

| Field | Value |
|-------|-------|
| **ID** | E13-F05 |
| **Epic** | E-13 |
| **Release** | R3 |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 3 |
| **Status** | Backlog |

**Description:**
As the operations team, I want a production-ready Docker image for the Admin Agent so that it can be deployed consistently across local, DEV, and PROD environments.

**Acceptance Criteria:**
- [ ] Multi-stage Dockerfile in `admin-agent/Dockerfile`
- [ ] Build stage compiles TypeScript; runtime stage uses a slim Node.js image
- [ ] Image size under 150 MB
- [ ] Runs as non-root user inside the container
- [ ] `docker compose build admin-agent` succeeds without errors
- [ ] Container starts and responds to health check within 5 seconds

---

### E13-F06: Portal-to-Agent Integration Tests

| Field | Value |
|-------|-------|
| **ID** | E13-F06 |
| **Epic** | E-13 |
| **Release** | R3 |
| **Type** | Non-Functional |
| **Priority** | Should |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As a developer, I want integration tests that exercise the full Portal API → Admin Agent → Docker flow so that I can verify the provisioning pipeline works end-to-end in a local environment.

**Acceptance Criteria:**
- [ ] Test covers: Portal API calls Admin Agent `POST /compose/up` → container is created → `GET /containers` returns it
- [ ] Test covers: Portal API calls Admin Agent `POST /compose/down` → container is removed
- [ ] Test covers: `POST /containers/:name/restart` → container restarts successfully
- [ ] Tests run against a live Docker daemon (require Docker socket access)
- [ ] Tests use a test username (e.g., `test-user`) and clean up after themselves
- [ ] Can be run via `npm test` in the `admin-agent/` directory
