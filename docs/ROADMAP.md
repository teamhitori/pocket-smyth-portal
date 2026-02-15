# Roadmap — Pocket Smyth Portal

Feature rollout plan for Portal UI, Control Plane API, and Provisioning Functions.
For infrastructure provisioning (VM, Traefik, DNS, TLS), see [logic-agent-platform/docs/roadmap.md](https://github.com/teamhitori/logic-agent-platform/blob/main/docs/roadmap.md).

---

## Environments

| Environment | URL Pattern | Purpose |
|---|---|---|
| **DEV** | `login.dev.teamhitori.com`, `{user}.dev.teamhitori.com` | Development & testing |
| **PROD** | `login.teamhitori.com`, `{user}.teamhitori.com` | Production |

Both environments run the same stack. DEV uses `*.dev.teamhitori.com` wildcard, PROD uses `*.teamhitori.com`. Infrastructure for both is provisioned in `logic-agent-platform`.

---

## Phase 1: Project Scaffolding & Dev Environment

*Set up the repo structure, tooling, and local dev workflow.*

| Task | Description | Status |
|------|-------------|--------|
| 1.1 | Scaffold `portal/` — Next.js 14, TypeScript, Tailwind CSS, App Router | ⬜ |
| 1.2 | Scaffold `api/` — FastAPI project structure, requirements.txt, Dockerfile | ⬜ |
| 1.3 | Scaffold `functions/` — Azure Functions project (Python v2 model) | ⬜ |
| 1.4 | Scaffold `shared/` — shared types/constants (TypeScript + Python) | ⬜ |
| 1.5 | Create `docker-compose.yml` for local dev (Portal + API + mock OAuth2-Proxy) | ⬜ |
| 1.6 | Configure ESLint, Prettier, ruff (Python linting) | ⬜ |
| 1.7 | Add `.env.example` with required environment variables | ⬜ |
| 1.8 | Set up local dev auth bypass (mock JWT header injection) | ⬜ |
| 1.9 | Verify local stack: Portal + API running, hot reload working | ⬜ |

**Deliverable:** Working local dev environment with all projects scaffolded.

---

## Phase 2: Portal UI MVP

*Core user-facing pages — onboarding, dashboard, and status screens.*

| Task | Description | Status |
|------|-------------|--------|
| 2.1 | Implement Next.js Middleware — JWT decode, host-based routing | ⬜ |
|     | - `login.*` → auth routes (`/pending`, `/onboarding`, `/revoked`) | |
|     | - `{username}.*` → dashboard routes | |
| 2.2 | Implement pending screen (`/pending`) — static "Awaiting Approval" page | ⬜ |
| 2.3 | Implement revoked screen (`/revoked`) — static "Access Revoked" page | ⬜ |
| 2.4 | Implement onboarding wizard (`/onboarding`): | ⬜ |
|     | - Username input (alphanumeric, 4-10 chars, profanity filter) | |
|     | - Username uniqueness check via API | |
|     | - Phone number input (mandatory) | |
|     | - Confirm → POST to Control Plane API | |
| 2.5 | Implement user dashboard (`/`) — trusted shell layout: | ⬜ |
|     | - Header (branding, user menu, logout) | |
|     | - Sidebar (dashboard, settings) | |
|     | - Agent Zero iframe (`/agent/`) | |
|     | - Status bar (agent health, CPU, memory) | |
| 2.6 | Implement client-side polling — `/api/me/agent` every 10s | ⬜ |
| 2.7 | Implement user actions — restart agent, stop agent | ⬜ |
| 2.8 | Add redirect: after onboarding → `{username}.teamhitori.com` | ⬜ |

**Deliverable:** Complete user-facing Portal UI (pending, onboarding, dashboard).

---

## Phase 3: Admin Panel

*Admin views for user management and system monitoring.*

| Task | Description | Status |
|------|-------------|--------|
| 3.1 | Implement admin layout — sidebar nav (pending users, all users, system) | ⬜ |
| 3.2 | Implement pending users page (`/admin/pending`): | ⬜ |
|     | - List pending users with sign-up date | |
|     | - Approve / reject buttons | |
|     | - Pending count badge in nav | |
| 3.3 | Implement all users page (`/admin/users`): | ⬜ |
|     | - Tabular list (username, status, role, created) | |
|     | - Filter by status | |
|     | - Actions: revoke, soft delete | |
| 3.4 | Implement user detail page (`/admin/users/:id`): | ⬜ |
|     | - User info, status history | |
|     | - Agent container status (running/stopped, uptime, resources) | |
|     | - Restart / stop agent | |
| 3.5 | Implement system status page (`/admin/system`): | ⬜ |
|     | - VM resource overview (CPU, RAM, disk) | |
|     | - Container count, port allocation | |

**Deliverable:** Working admin panel with user approval workflow.

---

## Phase 4: Control Plane API

*FastAPI backend for user management, B2C integration, and Docker operations.*

| Task | Description | Status |
|------|-------------|--------|
| 4.1 | Set up FastAPI app structure (`api/app/main.py`, routers, models) | ⬜ |
| 4.2 | Implement JWT validation middleware (decode `X-Auth-Request-Access-Token`) | ⬜ |
| 4.3 | Implement role-based access control (user vs admin routes) | ⬜ |
| 4.4 | Implement Graph API client — read/write B2C custom attributes | ⬜ |
| 4.5 | Implement user endpoints: | ⬜ |
|     | - `GET /api/me` — current user info from B2C | |
|     | - `GET /api/me/agent` — agent container status (via Admin Agent) | |
|     | - `POST /api/me/agent/restart` — restart own agent | |
|     | - `PUT /api/me/settings` — update preferences | |
| 4.6 | Implement admin endpoints: | ⬜ |
|     | - `GET /api/users` — list all users | |
|     | - `POST /api/users/:id/approve` — approve + queue provisioning | |
|     | - `POST /api/users/:id/reject` — reject user | |
|     | - `POST /api/users/:id/revoke` — revoke access (stop container) | |
|     | - `DELETE /api/users/:id` — soft delete | |
| 4.7 | Implement system endpoints: | ⬜ |
|     | - `GET /api/system/status` — VM resource overview | |
|     | - `GET /api/system/config` — system configuration | |
| 4.8 | Implement Admin Agent client — HTTP calls to sidecar container | ⬜ |
| 4.9 | Implement username validation (reserved words, profanity, uniqueness) | ⬜ |
| 4.10 | Add request logging and error handling | ⬜ |
| 4.11 | Build API Dockerfile | ⬜ |

**Deliverable:** Fully functional Control Plane API.

---

## Phase 5: Admin Agent Container

*Sidecar container for Docker management operations.*

| Task | Description | Status |
|------|-------------|--------|
| 5.1 | Create Admin Agent project (Python/FastAPI, lightweight) | ⬜ |
| 5.2 | Implement Docker socket integration: | ⬜ |
|     | - `GET /containers` — list all user containers | |
|     | - `GET /containers/:name/stats` — CPU, memory, storage | |
|     | - `POST /containers/:name/restart` — restart user stack | |
|     | - `POST /containers/:name/stop` — stop user stack | |
|     | - `POST /compose/up` — provision new user stack | |
|     | - `POST /compose/down` — tear down user stack | |
| 5.3 | Implement shared secret authentication (portal-net only) | ⬜ |
| 5.4 | Implement Traefik file provider updates (dynamic per-user routes) | ⬜ |
| 5.5 | Build Admin Agent Dockerfile | ⬜ |
| 5.6 | Integration test: Control Plane API → Admin Agent → Docker | ⬜ |

**Deliverable:** Working Admin Agent sidecar with scoped Docker management API.

---

## Phase 6: Async Provisioning (Azure Functions)

*Queue-based user stack provisioning.*

| Task | Description | Status |
|------|-------------|--------|
| 6.1 | Implement queue trigger function — read provisioning message | ⬜ |
| 6.2 | Implement SSH-to-VM logic (key from Azure Key Vault) | ⬜ |
| 6.3 | Implement provisioning flow: | ⬜ |
|     | - SSH to VM, run `docker compose up` for user stack | |
|     | - Update B2C: `status=active`, `containerPort=XXXX` | |
|     | - Update Traefik file provider (new user route) | |
| 6.4 | Implement de-provisioning function: | ⬜ |
|     | - Stop container, remove Traefik route | |
|     | - Set B2C `status=revoked` | |
|     | - Preserve data on disk | |
| 6.5 | Update Control Plane API: queue message on approve (instead of direct) | ⬜ |
| 6.6 | Error handling: retry logic, dead-letter queue, admin notification | ⬜ |
| 6.7 | Test full lifecycle: approve → queue → provision → active | ⬜ |

**Deliverable:** Async provisioning via Azure Queue Storage + Azure Functions.

---

## Phase 7: Notifications & Email

*Admin alerts and user communication.*

| Task | Description | Status |
|------|-------------|--------|
| 7.1 | Integrate email service (SendGrid or Azure Communication Services) | ⬜ |
| 7.2 | Send "New user pending" email to admin on sign-up | ⬜ |
| 7.3 | Send "Account approved" email to user on approval | ⬜ |
| 7.4 | Send "Account revoked" email to user on revocation | ⬜ |
| 7.5 | Admin dashboard: pending count badge, recent activity feed | ⬜ |

**Deliverable:** Email notifications for key lifecycle events.

---

## Phase 8: Polish & Production Readiness

*Hardening, testing, and documentation for launch.*

| Task | Description | Status |
|------|-------------|--------|
| 8.1 | End-to-end testing: full user lifecycle on DEV environment | ⬜ |
| 8.2 | Add health check endpoints (`/api/health`, `/api/ready`) | ⬜ |
| 8.3 | Implement graceful error pages (500, 404, auth errors) | ⬜ |
| 8.4 | Review and harden CORS, CSP, security headers | ⬜ |
| 8.5 | Performance: optimize SSR, bundle size, API response times | ⬜ |
| 8.6 | Create CI/CD pipeline (GitHub Actions → build → deploy to VM) | ⬜ |
| 8.7 | Write user guide (onboarding, dashboard, agent usage) | ⬜ |
| 8.8 | Write admin guide (approval workflow, system monitoring) | ⬜ |
| 8.9 | Deploy to PROD, verify full lifecycle with real users | ⬜ |

**Deliverable:** Production-ready portal for 10 users.

---

## Dependencies on `logic-agent-platform`

These infrastructure items must be provisioned in `logic-agent-platform` before the corresponding portal phases:

| Portal Phase | Infrastructure Dependency |
|---|---|
| Phase 1 (Scaffolding) | Dev VM + Traefik + `*.dev.teamhitori.com` wildcard TLS |
| Phase 2–3 (Portal UI) | OAuth2-Proxy configured for `login.dev.teamhitori.com` |
| Phase 4 (API) | `portal-net` Docker network on VM |
| Phase 5 (Admin Agent) | Docker socket access policy, Admin Agent in Docker Compose |
| Phase 6 (Functions) | Azure Queue Storage, Azure Key Vault, Azure Function App resource |
| Phase 8 (Production) | Prod VM config, `*.teamhitori.com` OAuth2-Proxy callback at `login.teamhitori.com` |

---

## Success Criteria

- [ ] User can sign up, get approved, complete onboarding, and access their agent
- [ ] Admin can approve/reject/revoke users from the dashboard
- [ ] Agent Zero loads in iframe at `{username}.teamhitori.com`
- [ ] Agent restart works from dashboard
- [ ] Provisioning completes in < 5 minutes
- [ ] DEV and PROD environments running independently
- [ ] 10 users running simultaneously without issues
