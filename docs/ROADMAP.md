# Roadmap — Pocket Smyth Portal

Feature rollout plan for the Portal (Next.js + API Routes) and Admin Agent (Hono).
For infrastructure provisioning (VM, Traefik, DNS, TLS), see [logic-agent-platform/docs/roadmap.md](https://github.com/teamhitori/logic-agent-platform/blob/main/docs/roadmap.md).

---

## Environments

| Environment | URL Pattern | Auth | Purpose |
|---|---|---|---|
| **Local** | `localhost:4180` (OAuth2-Proxy) → `localhost:3000` (Portal) | Real B2C (dev app registration) | Development, no subdomains |
| **DEV** | `login.dev.teamhitori.com`, `{user}.dev.teamhitori.com` | Real B2C + OAuth2-Proxy | Testing with full subdomain routing |
| **PROD** | `login.teamhitori.com`, `{user}.teamhitori.com` | Real B2C + OAuth2-Proxy | Production |

---

## Phase 1: Repo Cleanup, Scaffolding & Local Dev Environment

*Remove old Python code, set up TypeScript-only repo structure, establish local dev workflow with real B2C auth.*

### 1A — Remove Old Python Code

| Task | Description | Who | Status |
|------|-------------|-----|--------|
| 1A.1 | Delete `api/` directory (old FastAPI project) | Agent | ⬜ |
| 1A.2 | Delete `functions/` directory (old Azure Functions project) | Agent | ⬜ |
| 1A.3 | Delete `shared/python/` directory | Agent | ⬜ |
| 1A.4 | Delete `mock-auth/` directory (replaced by real OAuth2-Proxy) | Agent | ⬜ |
| 1A.5 | Delete `ruff.toml` (Python linter config) | Agent | ⬜ |
| 1A.6 | Remove Python-specific env vars from `.env.example` (keep B2C vars) | Agent | ⬜ |
| 1A.7 | Remove `api` service from `docker-compose.yml` | Agent | ⬜ |
| 1A.8 | Remove `mock-auth` service from `docker-compose.yml` | Agent | ⬜ |
| 1A.9 | Verify no remaining Python references in repo (`grep -r "python\|fastapi\|uvicorn\|ruff" --include="*.yml" --include="*.json" --include="*.ts"`) | Agent | ⬜ |

> **⏸ CHECKPOINT 1A:** Review the cleanup diff (`git diff`). Confirm all Python code removed, no accidental deletions. Commit: `chore: remove Python code (FastAPI, Functions, mock-auth)`.

### 1B — Scaffold TypeScript Projects

| Task | Description | Who | Status |
|------|-------------|-----|--------|
| 1B.1 | Restructure `portal/` — ensure Next.js 14, TypeScript, Tailwind CSS, App Router. Add `src/app/api/` stub dirs for API routes | Agent | ⬜ |
| 1B.2 | Scaffold `admin-agent/` — Hono project with TypeScript, dockerode dependency | Agent | ⬜ |
| 1B.3 | Update `shared/ts/` — add `dev` and `login` to `RESERVED_USERNAMES`, remove any Python cross-refs | Agent | ⬜ |
| 1B.4 | Configure ESLint, Prettier (repo-wide, TS-only) | Agent | ⬜ |
| 1B.5 | Update `.env.example` — add OAuth2-Proxy vars (`OAUTH2_PROXY_CLIENT_ID`, `OAUTH2_PROXY_CLIENT_SECRET`, `OAUTH2_PROXY_COOKIE_SECRET`, `B2C_OIDC_ISSUER_URL`) | Agent | ⬜ |

> **⏸ CHECKPOINT 1B:** Verify project structure: `portal/`, `admin-agent/`, `shared/ts/`. Run `npm install` in portal and admin-agent, confirm no errors. Commit: `feat: scaffold TypeScript projects (portal, admin-agent, shared)`.

### 1C — Dev B2C App Registration (Manual)

| Task | Description | Who | Status |
|------|-------------|-----|--------|
| 1C.1 | **MANUAL:** Log into Azure Portal → B2C tenant (`359dc45f-...`) | You | ⬜ |
| 1C.2 | **MANUAL:** Create new App Registration named `pocket-smyth-portal-dev` | You | ⬜ |
|      | - Platform: Web | | |
|      | - Redirect URI: `http://localhost:4180/oauth2/callback` | | |
|      | - Supported account types: Accounts in this organizational directory only | | |
| 1C.3 | **MANUAL:** Generate a client secret, note the value | You | ⬜ |
| 1C.4 | **MANUAL:** Grant API permissions: `openid`, `offline_access`, plus any custom scopes for Graph API access | You | ⬜ |
| 1C.5 | **MANUAL:** Verify the B2C user flow / custom policy returns custom attributes (`Status`, `Role`, `Username`, `ContainerPort`) in the ID or access token | You | ⬜ |
| 1C.6 | **MANUAL:** Populate `.env` with actual values: | You | ⬜ |
|      | ```env | | |
|      | OAUTH2_PROXY_CLIENT_ID=<from 1C.2> | | |
|      | OAUTH2_PROXY_CLIENT_SECRET=<from 1C.3> | | |
|      | OAUTH2_PROXY_COOKIE_SECRET=<run: python3 -c "import os,base64;print(base64.urlsafe_b64encode(os.urandom(32)).decode())"> | | |
|      | B2C_OIDC_ISSUER_URL=https://<tenant>.b2clogin.com/<tenant>.onmicrosoft.com/<policy>/v2.0 | | |
|      | B2C_TENANT_ID=359dc45f-49b6-4472-92f1-092556a84a98 | | |
|      | B2C_GRAPH_CLIENT_ID=6c50fb10-e1d2-4ca7-be00-6cb29b7f474b | | |
|      | B2C_GRAPH_CLIENT_SECRET=<your secret> | | |
|      | ``` | | |

> **⏸ CHECKPOINT 1C:** Confirm `.env` is populated. Run `cat .env | grep OAUTH2_PROXY_CLIENT_ID` to verify it's not empty. Do NOT commit `.env` to git.

### 1D — Docker Compose & OAuth2-Proxy

| Task | Description | Who | Status |
|------|-------------|-----|--------|
| 1D.1 | Rewrite `docker-compose.yml` — Portal + OAuth2-Proxy + Admin Agent services | Agent | ⬜ |
|      | - `oauth2-proxy` service: `quay.io/oauth2-proxy/oauth2-proxy:latest`, port 4180, configured via env vars | | |
|      | - `portal` service: Next.js on port 3000, proxied through oauth2-proxy | | |
|      | - `admin-agent` service: Hono on port 8080, internal `portal-net` only | | |
| 1D.2 | Verify `docker compose build` succeeds for all services | Agent | ⬜ |

> **⏸ CHECKPOINT 1D:** Run `docker compose up`. Confirm:
> 1. All 3 containers start without errors
> 2. `http://localhost:4180` redirects to B2C login page
> 3. No mock-auth or FastAPI containers running

### 1E — End-to-End Auth Verification (Manual Test)

| Task | Description | Who | Status |
|------|-------------|-----|--------|
| 1E.1 | **MANUAL TEST:** Open `http://localhost:4180` in browser | You | ⬜ |
| 1E.2 | **MANUAL TEST:** Confirm redirect to B2C login page | You | ⬜ |
| 1E.3 | **MANUAL TEST:** Log in with a test B2C account | You | ⬜ |
| 1E.4 | **MANUAL TEST:** Confirm redirect back to Portal (Next.js page loads) | You | ⬜ |
| 1E.5 | **MANUAL TEST:** Check browser dev tools → Network → verify `X-Auth-Request-Access-Token` header is present on Portal requests | You | ⬜ |
| 1E.6 | **MANUAL TEST:** Verify decoded JWT contains custom attributes (`extension_..._Status`, `extension_..._Role`, etc.) — use browser console or Portal debug output | You | ⬜ |

> **⏸ CHECKPOINT 1E:** Real B2C auth is working end-to-end locally. JWT with custom claims is reaching the Portal. Commit: `feat: local dev environment with real OAuth2-Proxy + B2C auth`. **Phase 1 complete.**

**Deliverable:** Clean TypeScript-only repo with working local dev environment. Real B2C login via OAuth2-Proxy returns valid JWT with custom attributes.

---

## Phase 2: Portal UI MVP

*Core user-facing pages — onboarding, dashboard, and status screens.*

| Task | Description | Who | Status |
|------|-------------|-----|--------|
| 2.1 | Implement Next.js Middleware — JWT decode, host-based routing, subdomain validation | Agent | ⬜ |
|     | - `login.*` → auth routes (`/pending`, `/onboarding`, `/revoked`) | | |
|     | - `{username}.*` → dashboard routes (validate JWT username matches Host) | | |
|     | - Local: skip subdomain routing (no subdomains on localhost) | | |
| 2.2 | Implement pending screen (`/pending`) — static "Awaiting Approval" page | Agent | ⬜ |
| 2.3 | Implement revoked screen (`/revoked`) — static "Access Revoked" page | Agent | ⬜ |
| 2.4 | Implement onboarding wizard (`/onboarding`): | Agent | ⬜ |
|     | - Username input (alphanumeric, 4-10 chars, profanity filter) | | |
|     | - Username uniqueness check via API | | |
|     | - Phone number input (mandatory) | | |
|     | - Confirm → POST to API route | | |
| 2.5 | Implement user dashboard (`/`) — trusted shell layout: | Agent | ⬜ |
|     | - Header (branding, user menu, logout) | | |
|     | - Sidebar (dashboard, settings) | | |
|     | - Agent status panel (running/stopped, CPU, memory) | | |
|     | - Launch Agent button (opens new tab to `/agent/`) | | |
|     | - Status bar (agent health, uptime) | | |
| 2.6 | Implement API routes for user endpoints: | Agent | ⬜ |
|     | - `GET /api/me` — current user info from B2C | | |
|     | - `GET /api/me/agent` — agent container status (via Admin Agent) | | |
|     | - `POST /api/me/agent/restart` — restart own agent | | |
|     | - `PUT /api/me/settings` — update preferences | | |
| 2.7 | Implement client-side polling — `/api/me/agent` every 10s | Agent | ⬜ |
| 2.8 | Add redirect: after onboarding → `{username}.teamhitori.com` | Agent | ⬜ |

> **⏸ CHECKPOINT 2:** Manual test locally:
> 1. Log in via `localhost:4180` → B2C login → redirected to Portal
> 2. With a `status=pending` test user: confirm `/pending` page renders
> 3. With a `status=approved` test user: confirm `/onboarding` page renders, submit wizard, verify API call succeeds
> 4. With a `status=active` test user: confirm dashboard renders, agent status panel shows data, Launch Agent button present
> 5. Verify `GET /api/me` returns decoded JWT claims
>
> Commit: `feat: portal UI MVP (user pages + API routes)`

**Deliverable:** Complete user-facing Portal UI + user API routes.

---

## Phase 3: Admin Panel + Admin API Routes

*Admin views for user management and system monitoring, plus admin API endpoints.*

| Task | Description | Who | Status |
|------|-------------|-----|--------|
| 3.1 | Implement admin layout — sidebar nav at `{username}.teamhitori.com/admin/*` | Agent | ⬜ |
| 3.2 | Implement pending users page (`/admin/pending`): | Agent | ⬜ |
|     | - List pending users with sign-up date | | |
|     | - Approve / reject buttons | | |
|     | - Pending count badge in nav | | |
| 3.3 | Implement all users page (`/admin/users`): | Agent | ⬜ |
|     | - Tabular list (username, status, role, created) | | |
|     | - Filter by status | | |
|     | - Actions: revoke, soft delete | | |
| 3.4 | Implement user detail page (`/admin/users/:id`): | Agent | ⬜ |
|     | - User info, status history | | |
|     | - Agent container status (running/stopped, uptime, resources) | | |
|     | - Restart / stop agent | | |
| 3.5 | Implement system status page (`/admin/system`): | Agent | ⬜ |
|     | - VM resource overview (CPU, RAM, disk) | | |
|     | - Container count, port allocation | | |
| 3.6 | Implement admin API routes: | Agent | ⬜ |
|     | - `GET /api/users` — list all users | | |
|     | - `POST /api/users/:id/approve` — approve + trigger provisioning | | |
|     | - `POST /api/users/:id/reject` — reject user | | |
|     | - `POST /api/users/:id/revoke` — revoke access (stop container) | | |
|     | - `DELETE /api/users/:id` — soft delete | | |
|     | - `GET /api/system/status` — VM resource overview | | |
|     | - `GET /api/system/config` — system configuration | | |
| 3.7 | Implement Graph API client — read/write B2C custom attributes | Agent | ⬜ |
| 3.8 | Implement username validation (reserved words, profanity, uniqueness) | Agent | ⬜ |
| 3.9 | Add request logging and error handling for API routes | Agent | ⬜ |
| 3.10 | **MANUAL:** Create 2–3 test users in B2C with different statuses (`pending`, `active`, `revoked`) for testing admin workflows | You | ⬜ |

> **⏸ CHECKPOINT 3:** Manual test locally:
> 1. Log in as admin user → navigate to `/admin/pending` → see pending test users
> 2. Approve a pending user → verify B2C `status` updated to `approved` via Graph API
> 3. View `/admin/users` → verify all test users listed with correct statuses
> 4. Revoke a user → verify B2C `status` updated to `revoked`
> 5. Check `/admin/system` → verify system stats render
>
> Commit: `feat: admin panel + admin API routes`

**Deliverable:** Working admin panel + all API routes.

---

## Phase 4: Admin Agent

*Hono/TypeScript sidecar container for Docker management via dockerode.*

| Task | Description | Who | Status |
|------|-------------|-----|--------|
| 4.1 | Implement Hono server with shared secret auth middleware | Agent | ⬜ |
| 4.2 | Implement dockerode integration: | Agent | ⬜ |
|     | - `GET /containers` — list all user containers | | |
|     | - `GET /containers/:name/stats` — CPU, memory, storage | | |
|     | - `POST /containers/:name/restart` — restart user stack | | |
|     | - `POST /containers/:name/stop` — stop user stack | | |
|     | - `POST /compose/up` — provision new user stack | | |
|     | - `POST /compose/down` — tear down user stack | | |
| 4.3 | Implement port scanning — find next available port from running containers | Agent | ⬜ |
| 4.4 | Implement Traefik file provider writer — create/remove dynamic per-user routes | Agent | ⬜ |
| 4.5 | Build Admin Agent Dockerfile | Agent | ⬜ |
| 4.6 | Integration test: Portal API → Admin Agent → Docker | Agent | ⬜ |

> **⏸ CHECKPOINT 4:** Manual test locally:
> 1. `docker compose up` — verify Admin Agent container starts, health endpoint responds
> 2. `curl -H 'Authorization: Bearer dev-secret' http://localhost:8080/containers` → returns container list
> 3. Test full provisioning flow: approve user in admin panel → Portal API calls Admin Agent → container spun up → verify with `docker ps`
> 4. Test restart: restart user's agent via admin panel → confirm container restart in `docker ps`
> 5. Verify Traefik file provider YAML written to expected path
>
> Commit: `feat: admin agent sidecar (Hono + dockerode)`

**Deliverable:** Working Admin Agent sidecar with scoped Docker management API.

---

## Phase 5: Notifications & Email

*Admin alerts and user communication.*

| Task | Description | Who | Status |
|------|-------------|-----|--------|
| 5.1 | **MANUAL:** Choose email provider and create account/resource (SendGrid or Azure Communication Services) | You | ⬜ |
| 5.2 | **MANUAL:** Add email API key / connection string to `.env` | You | ⬜ |
| 5.3 | Integrate email service client in Portal API routes | Agent | ⬜ |
| 5.4 | Send "New user pending" email to admin on sign-up | Agent | ⬜ |
| 5.5 | Send "Account approved" email to user on approval | Agent | ⬜ |
| 5.6 | Send "Account revoked" email to user on revocation | Agent | ⬜ |
| 5.7 | Admin dashboard: pending count badge, recent activity feed | Agent | ⬜ |

> **⏸ CHECKPOINT 5:** Manual test:
> 1. Sign up a new test user → verify admin receives "New user pending" email
> 2. Approve the user → verify user receives "Account approved" email
> 3. Revoke the user → verify user receives "Account revoked" email
>
> Commit: `feat: email notifications for lifecycle events`

**Deliverable:** Email notifications for key lifecycle events.

---

## Phase 6: Polish & Production Readiness

*Hardening, testing, and documentation for launch.*

| Task | Description | Who | Status |
|------|-------------|-----|--------|
| 6.1 | Add health check endpoints (`/api/health`, `/api/ready`) | Agent | ⬜ |
| 6.2 | Implement graceful error pages (500, 404, auth errors) | Agent | ⬜ |
| 6.3 | Review and harden CORS, CSP, security headers | Agent | ⬜ |
| 6.4 | Performance: optimize SSR, bundle size, API response times | Agent | ⬜ |
| 6.5 | Create CI/CD pipeline (GitHub Actions → build → deploy to VM) | Agent | ⬜ |
| 6.6 | Write user guide (onboarding, dashboard, agent usage) | Agent | ⬜ |
| 6.7 | Write admin guide (approval workflow, system monitoring) | Agent | ⬜ |
| 6.8 | **MANUAL:** Deploy to DEV environment (`*.dev.teamhitori.com`) | You | ⬜ |

> **⏸ CHECKPOINT 6A:** Manual E2E test on DEV environment:
> 1. Open `login.dev.teamhitori.com` → B2C login works
> 2. New user → pending → admin approves → onboarding → username chosen → agent provisioned → dashboard loads
> 3. Launch Agent → new tab opens `{username}.dev.teamhitori.com/agent/`
> 4. Admin revoke → user sees `/revoked` page
> 5. Subdomain validation: try accessing another user's subdomain → blocked

| Task | Description | Who | Status |
|------|-------------|-----|--------|
| 6.9 | **MANUAL:** Configure PROD OAuth2-Proxy callback at `login.teamhitori.com` | You | ⬜ |
| 6.10 | **MANUAL:** Deploy to PROD (`*.teamhitori.com`) | You | ⬜ |

> **⏸ CHECKPOINT 6B:** Manual E2E test on PROD:
> 1. Repeat Checkpoint 6A tests on `*.teamhitori.com`
> 2. Verify TLS cert valid for wildcard
> 3. Verify 10 users can run simultaneously
>
> **Phase 6 complete. Ship it.**

**Deliverable:** Production-ready portal for 10 users.

---

## Dependencies on `logic-agent-platform`

These infrastructure items must be provisioned in `logic-agent-platform` before the corresponding portal phases:

| Portal Phase | Infrastructure Dependency |
|---|---|
| Phase 1 (Scaffolding) | Dev B2C app registration with localhost redirect URI |
| Phase 2–3 (Portal + Admin) | Dev VM + Traefik + `*.dev.teamhitori.com` wildcard TLS, OAuth2-Proxy |
| Phase 4 (Admin Agent) | Docker socket access policy, `portal-net` Docker network on VM |
| Phase 6 (Production) | Prod VM config, `*.teamhitori.com` OAuth2-Proxy callback at `login.teamhitori.com` |

---

## Success Criteria

- [ ] User can sign up via real B2C, get approved, complete onboarding, and access their agent
- [ ] Admin can approve/reject/revoke users from the dashboard
- [ ] Agent Zero opens in new tab at `{username}.teamhitori.com/agent/`
- [ ] Agent restart works from dashboard
- [ ] Provisioning completes synchronously (API → Admin Agent → Docker)
- [ ] Local dev uses real OAuth2-Proxy + B2C (no mock auth)
- [ ] DEV and PROD environments running independently
- [ ] 10 users running simultaneously without issues
