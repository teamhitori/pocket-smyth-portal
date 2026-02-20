# Architecture — Pocket Smyth Portal

> Architecture for the Portal (Next.js + API Routes) and Admin Agent (Hono).
> For infrastructure-level architecture, see [logic-agent-platform/docs/architecture.md](https://github.com/teamhitori/logic-agent-platform/blob/main/docs/architecture.md).

---

## Deployables

| Deployable | Technology | Directory | Purpose |
|---|---|---|---|
| **Portal** | Next.js 14 (TypeScript) | `portal/` | UI + API Routes — serves all subdomains |
| **Admin Agent** | Hono (TypeScript) | `admin-agent/` | Docker management sidecar via dockerode |
| **Token Proxy** | Node.js (vanilla) | `token-proxy/` | B2C token exchange workaround — adds `scope` to token requests |

Everything is TypeScript/JavaScript. No Python components.

---

## URL Structure

```
PROD:
  teamhitori.com/pocketsmyth              → Product landing page (Azure SWA, separate repo)
  login.teamhitori.com                    → Auth domain: OAuth2-Proxy callback, onboarding, pending screens
  {username}.teamhitori.com               → User portal dashboard
  {username}.teamhitori.com/agent/*       → Agent Zero UI (proxied to user container)
  {username}.teamhitori.com/api/*         → Next.js API Routes
  {username}.teamhitori.com/admin/*       → Admin panel (admin users only)

DEV:
  login.dev.teamhitori.com               → Dev auth domain
  {username}.dev.teamhitori.com           → Dev user portal
  {username}.dev.teamhitori.com/agent/*   → Dev Agent Zero
  {username}.dev.teamhitori.com/api/*     → Dev API Routes

LOCAL:
  localhost:4180                          → OAuth2-Proxy entry point (real B2C auth)
  localhost:3000                          → Portal (proxied through OAuth2-Proxy)
```

- DEV uses `*.dev.teamhitori.com` wildcard; PROD uses `*.teamhitori.com`. Separate OAuth2-Proxy cookie domains (`.dev.teamhitori.com` vs `.teamhitori.com`).
- **Local dev has no subdomains.** OAuth2-Proxy runs on `localhost:4180` with a dev B2C app registration. Subdomain routing is tested on DEV.
- One Next.js instance serves ALL subdomains. It reads `request.headers.host` to determine context:
  - `login.*` → auth/onboarding/pending routes
  - `{username}.*` → dashboard, agent launch, admin panel

---

## Authentication Flow

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐     ┌───────────────┐
│   Browser   │────▶│  OAuth2-Proxy    │────▶│  Azure AD    │────▶│  B2C Tenant   │
│             │◀────│  (Traefik route) │◀────│  B2C         │◀────│  (Google/     │
│             │     │                  │     │              │     │  GitHub/MS)   │
└─────────────┘     └──────────────────┘     └──────────────┘     └───────────────┘
                           │
                           │ Sets cookie: _oauth2_proxy
                           │ cookie-domain=.teamhitori.com (wildcard)
                           ▼
                    ┌──────────────────┐
                    │  Next.js Portal  │  Reads X-Auth-Request-Access-Token
                    │  (all subdomains)│  Base64-decodes JWT payload (no crypto
                    │                  │  verification — OAuth2-Proxy already validated)
                    └──────────────────┘
```

### Key Points

- **OAuth2-Proxy** callback URL: `login.teamhitori.com/oauth2/callback`
- **Cookie domain:** `.teamhitori.com` — wildcard covers `login.*` and all `{username}.*` subdomains
- **JWT source:** `X-Auth-Request-Access-Token` header injected by OAuth2-Proxy
- **No crypto verification in Next.js** — OAuth2-Proxy is the trust boundary; Portal base64-decodes the JWT payload to extract `status`, `role`, and `username`
- **Subdomain validation:** Next.js middleware verifies the JWT `username` claim matches the Host subdomain. A user can only access `{their-username}.teamhitori.com`.

### Auth-Dependent Routing (Next.js Middleware)

| JWT `status` | JWT `role` | Host | Route |
|---|---|---|---|
| `pending` | any | `login.*` | `/pending` (static page) |
| `approved` | any | `login.*` | `/onboarding` (wizard) |
| `active` | `user` | `{username}.*` | `/` (dashboard) |
| `active` | `admin` | `{username}.*` | `/` or `/admin/*` |
| `revoked` | any | `login.*` | `/revoked` (static page) |

After onboarding completes, the user is redirected from `login.teamhitori.com` to `{username}.teamhitori.com`.

---

## Local Development Auth

Local dev uses a **real OAuth2-Proxy** container pointed at a **dev B2C app registration** — no mock/fake JWT injection.

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Browser   │────▶│  OAuth2-Proxy    │────▶│  Azure AD    │
│ localhost:   │◀────│  localhost:4180   │◀────│  B2C (dev    │
│   4180      │     │                  │     │  app reg)    │
└─────────────┘     └──────────────────┘     └──────────────┘
                           │
                           │ Token exchange routed
                           │ through token-proxy
                           │ (adds scope param)
                           │
                    ┌──────────────────┐
                    │  Token Proxy      │
                    │  localhost:8888   │
                    └──────────────────┘
                           │
                           │ X-Auth-Request-Access-Token
                           ▼
                    ┌──────────────────┐
                    │  Next.js Portal  │
                    │  localhost:3000   │
                    └──────────────────┘
```

### Setup

1. Create a **dev app registration** in the B2C tenant with redirect URI: `http://localhost:4180/oauth2/callback`
2. **Expose an API** on the app registration: set Application ID URI, add scope `access_as_user`, grant admin consent
3. Populate `.env` with `OAUTH2_PROXY_CLIENT_ID`, `OAUTH2_PROXY_CLIENT_SECRET`, `OAUTH2_PROXY_COOKIE_SECRET`, `B2C_OIDC_ISSUER_URL`, `B2C_API_SCOPE`, and `B2C_TOKEN_ENDPOINT_PATH`
4. `docker compose up` — starts Portal + OAuth2-Proxy + Admin Agent + Token Proxy

### B2C Compatibility Notes

Azure AD B2C has several non-standard OIDC behaviors that require workarounds:

| Issue | Symptom | Workaround |
|-------|---------|------------|
| B2C requires `scope` in token exchange POST body | `server response missing access_token` | Token Proxy sidecar intercepts token requests and appends `scope` parameter |
| B2C requires an exposed API scope to issue access tokens | Token response contains only `id_token` | Expose an API with scope `access_as_user` on the app registration |
| B2C uses `emails` (JSON array) instead of `email` claim | `neither the id_token nor the profileURL set an email` | `OAUTH2_PROXY_OIDC_EMAIL_CLAIM=emails` |
| B2C omits `email_verified` claim | Email verification fails silently | `OAUTH2_PROXY_INSECURE_OIDC_ALLOW_UNVERIFIED_EMAIL=true` |

### What's tested locally vs on DEV

| Concern | Local | DEV |
|---|---|---|
| B2C login + OIDC flow | ✅ | ✅ |
| JWT claim extraction | ✅ | ✅ |
| OAuth2-Proxy cookie/header injection | ✅ | ✅ |
| Subdomain routing (`login.*` vs `{user}.*`) | ❌ | ✅ |
| TLS / wildcard cert | ❌ | ✅ |
| Traefik routing rules | ❌ | ✅ |

---

## Traefik Routing Rules

All traffic enters via Traefik with TLS termination for `*.teamhitori.com` (DEV/PROD only).

```yaml
# Rule priority (highest to lowest):
# 1. login.teamhitori.com → OAuth2-Proxy → Next.js (auth routes)
# 2. {user}.teamhitori.com/api/* → OAuth2-Proxy → Next.js API Routes
# 3. {user}.teamhitori.com/agent/* → User's Agent Zero container (port from B2C)
# 4. {user}.teamhitori.com/* → OAuth2-Proxy → Next.js (portal shell)
```

| Rule | Target | Auth |
|---|---|---|
| `Host(login.teamhitori.com)` | OAuth2-Proxy → Next.js | OAuth2-Proxy handles |
| `Host({user}.teamhitori.com) && PathPrefix(/api/)` | OAuth2-Proxy → Next.js API Routes | OAuth2-Proxy handles |
| `Host({user}.teamhitori.com) && PathPrefix(/agent/)` | User container `:PORT` | Cookie (same domain) |
| `Host({user}.teamhitori.com)` | OAuth2-Proxy → Next.js | OAuth2-Proxy handles |

- **API Routes are behind OAuth2-Proxy.** Next.js API routes receive the `X-Auth-Request-Access-Token` header, same as UI routes.
- Dynamic per-user routes are configured via Traefik's **file provider**, written by the Admin Agent when users are provisioned.

---

## Portal UI Architecture

### Dashboard + Launch Button

```
┌─────────────────────────────────────────────────────┐
│  Trusted Shell (Next.js)                            │
│  ┌─────────────────────────────────────────────────┐│
│  │  Header: branding, user menu, logout            ││
│  ├──────────┬──────────────────────────────────────┤│
│  │ Sidebar  │                                      ││
│  │          │  Agent Status: ● Running             ││
│  │ Dashboard│  CPU: 12%  Memory: 256MB             ││
│  │ Settings │                                      ││
│  │ Admin ▸  │  ┌──────────────────────────┐        ││
│  │          │  │  🚀 Launch Agent         │        ││
│  │          │  │  (opens new tab)         │        ││
│  │          │  └──────────────────────────┘        ││
│  │          │                                      ││
│  ├──────────┴──────────────────────────────────────┤│
│  │  Status Bar: agent health, uptime               ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

- **Launch button opens Agent Zero in a new browser tab** at `{username}.teamhitori.com/agent/`. No iframe.
- Dashboard shows agent status, resource usage, and action buttons (restart, stop).
- Admin users see an additional `/admin/*` section in the sidebar.

### Agent Zero Path Prefix

Agent Zero will be forked to support a `/agent/` path prefix so it can be served at `{username}.teamhitori.com/agent/*` without conflicting with Portal routes.

### Portal Pages

| Page | Route | Who Sees It | Host |
|---|---|---|---|
| Pending screen | `/pending` | `status=pending` | `login.*` |
| Revoked screen | `/revoked` | `status=revoked` | `login.*` |
| Onboarding wizard | `/onboarding` | `status=approved`, no username | `login.*` |
| User dashboard | `/` | Active users | `{user}.*` |
| Admin dashboard | `/admin` | `role=admin` | `{user}.*` |
| Admin: Pending users | `/admin/pending` | Admins | `{user}.*` |
| Admin: User detail | `/admin/users/:id` | Admins | `{user}.*` |

---

## Control Plane API (Next.js API Routes)

API routes live inside the Portal at `portal/src/app/api/`. They are served at `{username}.teamhitori.com/api/*` behind OAuth2-Proxy.

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/me` | GET | User | Current user info (from B2C via Graph) |
| `/api/me/agent` | GET | User | Agent container status (via Admin Agent) |
| `/api/me/agent/restart` | POST | User | Restart own agent |
| `/api/me/settings` | PUT | User | Update settings |
| `/api/users` | GET | Admin | List all users |
| `/api/users/:id/approve` | POST | Admin | Approve pending user → triggers provisioning |
| `/api/users/:id/reject` | POST | Admin | Reject user |
| `/api/users/:id/revoke` | POST | Admin | Revoke access (stop container, preserve data) |
| `/api/users/:id` | DELETE | Admin | Soft delete (flag, stop container, preserve data) |
| `/api/system/status` | GET | Admin | System resource overview (via Admin Agent) |
| `/api/system/config` | GET/PUT | Admin | System configuration |

All API routes read the JWT from the `X-Auth-Request-Access-Token` header (injected by OAuth2-Proxy). No separate auth middleware needed — just base64-decode the payload.

### Debug Endpoint

`GET /api/me` decodes and returns claims from both tokens:
- **Access token** from `x-forwarded-access-token` header (standard OAuth claims)
- **ID token** from `Authorization: Bearer` header (custom B2C attributes: Status, Role, Username, ContainerPort)

`OAUTH2_PROXY_PASS_AUTHORIZATION_HEADER=true` must be set for the ID token to be forwarded.

### B2C User Management Scripts

| Script | Purpose |
|--------|---------|
| `scripts/b2c-get-user.ps1` | Read all user attributes (standard + extension) via Graph API |
| `scripts/b2c-set-user.ps1` | Write custom extension attributes (Status, Role, Username, ContainerPort) |

Both scripts dynamically discover extension property names from the b2c-extensions-app — no hardcoded attribute names.

---

## Container Management Architecture

### Admin Agent (Sidecar Pattern)

```
Next.js API Routes
    │
    │  HTTP (portal-net only, shared secret auth)
    ▼
Admin Agent Container (Hono + dockerode)
    │
    │  /var/run/docker.sock (mounted)
    ▼
Docker Daemon → manages all user stacks
```

The Admin Agent is a **Hono** (TypeScript) application using **dockerode** for Docker socket access. It exposes a scoped REST API on `portal-net` only:

| Endpoint | Method | Description |
|---|---|---|
| `/containers` | GET | List all user containers with status |
| `/containers/:name/stats` | GET | CPU, memory, storage for a container |
| `/containers/:name/restart` | POST | Restart a user's stack |
| `/containers/:name/stop` | POST | Stop a user's stack |
| `/compose/up` | POST | Provision a new user stack from template |
| `/compose/down` | POST | Tear down a user stack |

**Port allocation:** Admin Agent scans running Docker containers to find the next available port. No database needed.

**Traefik config:** Admin Agent writes Traefik file provider YAML when provisioning/deprovisioning users, creating or removing dynamic routes for `{username}.*` subdomains.

**Evolution path:**
- **MVP (single VM):** Admin Agent container with `/var/run/docker.sock` mount, HTTP API on `portal-net`.
- **Scale (multi-VM):** Promote to Node Agent pattern — one per VM, reporting to Control Plane via HTTPS.

### Container Image Strategy (AD-5)

- **Immutable:** Agent Zero Docker image is read-only. Container restart = fresh Agent Zero.
- **Mutable:** User data lives on separate mounted volumes at `/data/{username}/`.

**Recovery scenarios:**

| Scenario | Command | Agent Zero | User Data |
|---|---|---|---|
| Soft restart | `docker compose restart` | Fresh process | Preserved |
| Hard reset | `docker compose down && up` | Fresh container | Preserved |
| Full restore | Re-provision from scratch | Fresh image | Lost (unless backed up) |

---

## Provisioning Flow

Provisioning is **synchronous** — the Portal API calls the Admin Agent directly via HTTP. No queues, no Azure Functions.

```
Admin approves user (Portal UI)
    │
    ▼
Next.js API Route writes status=approved to B2C (Graph API)
    │
    ▼
User logs in → redirected to onboarding wizard (login.teamhitori.com/onboarding)
    │
    ▼
User completes wizard: username + phone number
    │
    ▼
Next.js API Route writes username to B2C
    │
    ▼
Next.js API Route calls Admin Agent: POST /compose/up {username}
    │
    ▼
Admin Agent:
  1. Scans Docker for next available port
  2. Runs docker compose up for user stack
  3. Writes Traefik file provider YAML (dynamic route for {username}.*)
    │
    ▼
Next.js API Route updates B2C: status=active, containerPort=XXXX
    │
    ▼
User redirected to {username}.teamhitori.com (dashboard)
```

### De-provisioning (Revoke/Delete)

```
Admin revokes user (Portal UI)
    │
    ▼
Next.js API Route calls Admin Agent: POST /compose/down {username}
    │
    ▼
Admin Agent:
  1. Stops container
  2. Removes Traefik file provider entry
    │
    ▼
Next.js API Route updates B2C: status=revoked
```

- Container stopped, data preserved on disk at `/data/{username}/`
- Traefik route removed
- Manual cleanup required for full data removal (MVP)

---

## Architectural Decisions

### AD-1: Hybrid SSR + Client Polling

Use Next.js Middleware + React Server Components for initial page load (SSR), with client-side polling for live data updates.

- **Middleware:** Decodes JWT from `X-Auth-Request-Access-Token`, extracts `status`, `role`, `username`, validates subdomain match, rewrites to correct route.
- **Server Components:** Fetch initial data from API routes via server-to-server call (same process).
- **Client Components:** Hydrate with server data. Poll `/api/me/agent` every 10s for live agent status.
- **Future:** Replace 10s polling with WebSocket/SSE push.

### AD-2: Launch Button → New Tab

Agent Zero opens in a **new browser tab** at `{username}.teamhitori.com/agent/`. The Portal serves as a dashboard and control surface — not a wrapper shell. This avoids iframe sandboxing complexity, gives Agent Zero the full viewport, and the auth cookie covers both paths (same origin).

### AD-3: Admin Agent Container (Hono + dockerode)

Dedicated TypeScript sidecar container with Docker socket access via dockerode. Separates business logic from Docker operations. Evolves to Node Agent pattern for multi-VM.

### AD-4: Soft Delete Only

User containers and data persist indefinitely. Deletion is flag-based only (`status=revoked`). No automated data destruction in MVP.

### AD-5: Immutable Agent Image + Mutable User Volumes

Agent Zero image is read-only. User data on separate volumes. Restart = fresh Agent Zero + preserved data.

### AD-6: Phone Number Mandatory at Onboarding

Required field in onboarding wizard as an authenticity check. Each account tied to a live phone number.

### AD-7: Username Constraints

- Alphanumeric + hyphens, 4–10 characters, lowercase
- Reserved words blocked: `admin`, `app`, `www`, `api`, `mail`, `portal`, `system`, `root`, `public`, `static`, `login`, `dev`
- Profanity filter applied
- Uniqueness validated via Graph API

### AD-8: Admin Notifications

Email notification to admin(s) on new sign-up. Admin dashboard shows pending count with approval queue.

### AD-9: MVP Scope Boundaries

| Feature | MVP (10 users) | Post-MVP |
|---|:-:|:-:|
| SSR + 10s polling | ✅ | WebSocket/SSE |
| Onboarding wizard | ✅ | Extended preferences |
| Admin approval + email | ✅ | Slack/webhook integrations |
| Admin Agent (Hono sidecar) | ✅ | Node Agent (multi-VM) |
| Port scanning (dynamic) | ✅ | Port recycling |
| Soft delete (flag-based) | ✅ | Automated cleanup + backup |
| Real OAuth2-Proxy locally | ✅ | — |
| No database | ✅ | SQLite/TimescaleDB |
| Rate limiting | ❌ | Per-user rate limits |
| Audit logging | ❌ | SQLite/TimescaleDB |
| Public URL exposure | ❌ | User-configurable routes |
| Container hardening | ❌ | userns, seccomp, AppArmor |
| Agent Zero restore | ❌ | Automated snapshots |

### AD-10: TypeScript Only

All components use TypeScript. No Python in the repo. This simplifies tooling (one language, one package manager, shared types) and reduces cognitive overhead.

### AD-11: API Routes inside Next.js

The Control Plane API is implemented as Next.js API Routes (`portal/src/app/api/`), not a separate FastAPI service. This eliminates a deployable, simplifies the stack, and shares auth logic with the UI layer.

### AD-12: Synchronous Provisioning

Provisioning is a synchronous HTTP call from Portal API → Admin Agent. No Azure Queue Storage, no Azure Functions. The Admin Agent runs `docker compose up` and returns when complete. Acceptable latency for MVP (10 users).

### AD-13: No Database for MVP

User data lives in B2C (Graph API). Container state is read from Docker. Config is environment variables. No SQLite, no PostgreSQL, no Redis.

---

## Security Model

The user environment is **untrusted by design** — each user gets a powerful, agentic environment capable of running root-level instructions within their container.

### Threat Model

| ID | Threat | Severity | Mitigation | Phase |
|----|--------|----------|------------|-------|
| T1 | Container escape to host OS | Critical | User namespaces (`userns-remap`), capability dropping | Post-MVP |
| T2 | Cross-user network/volume access | Critical | Per-user Docker network, scoped volume mounts | MVP |
| T3 | Resource exhaustion (fork bomb, disk fill) | High | CPU/memory/PID/storage limits per container | MVP |
| T4 | Agent Zero corruption/deletion | Medium | Immutable image + mutable volumes (AD-5) | MVP |
| T5 | Network pivot to portal-net/Docker API | High | Network isolation, Docker socket only on Admin Agent | MVP |
| T6 | Volume mount escape (symlinks) | High | Scoped mounts, no host path access | Post-MVP |
| T7 | Subdomain spoofing (accessing another user's portal) | High | JWT username ↔ Host subdomain validation in middleware | MVP |

### Planned Hardening (Post-MVP)

- **User namespaces:** `userns-remap` so root-in-container → unprivileged host user
- **Capability dropping:** `--cap-drop ALL` + explicit whitelist
- **seccomp profiles:** Restrict syscalls to safe subset
- **AppArmor profiles:** Mandatory access controls
- **Read-only root filesystem:** Agent Zero image as read-only, tmpfs for `/tmp`
- **No Docker socket in user containers:** Only Admin Agent has socket access

---

## B2C Configuration

### Custom Attributes

```
Extension prefix: extension_3575970a911e4699ad1ccc1a507d2312_
Attributes: Status, Role, Username, ContainerPort
```

| Attribute | Values |
|-----------|--------|
| Status | `pending` · `approved` · `active` · `revoked` |
| Role | `user` · `admin` |
| Username | URL-safe slug (e.g., `reuben`) |
| ContainerPort | Internal port for user's Docker stack (e.g., `8001`) |

### Graph API Credentials

```
Tenant ID:        359dc45f-49b6-4472-92f1-092556a84a98
Graph Client ID:  6c50fb10-e1d2-4ca7-be00-6cb29b7f474b
Secret:           stored in .env as B2C_GRAPH_CLIENT_SECRET
```

### Dev B2C App Registration

A separate app registration for local development with:
- Redirect URI: `http://localhost:4180/oauth2/callback`
- Same tenant, same custom attributes, same user pool
- **Exposed API** with scope `access_as_user` (required for B2C to issue access tokens)
- Client ID/secret stored in `.env` as `OAUTH2_PROXY_CLIENT_ID` / `OAUTH2_PROXY_CLIENT_SECRET`
- API scope stored in `.env` as `B2C_API_SCOPE`

---

## User Lifecycle

```
sign-up → pending → [admin approves] → approved → [onboarding] → active
                                                                    │
                                                         [admin revokes]
                                                                    ▼
                                                                 revoked
```

---

## Infrastructure

- **VM:** Hetzner CPX31 (8GB RAM, 4 vCPU), IP `178.156.214.79`
- **DNS:** Azure DNS, wildcard `*.teamhitori.com` → VM
- **TLS:** Traefik with Let's Encrypt, wildcard cert
- **Secrets:** `.env` files on VM (MVP); Azure Key Vault (post-MVP)
- **Environments:** Local (docker compose on localhost), DEV (`*.dev.teamhitori.com`), PROD (`*.teamhitori.com`)

---

## Related Documents

- [portal-spec.md](https://github.com/teamhitori/logic-agent-platform/blob/main/docs/portal-spec.md) — Full API spec, UI wireframes, data models
- [architecture.md](https://github.com/teamhitori/logic-agent-platform/blob/main/docs/architecture.md) — Platform-wide system architecture
- [roadmap.md](https://github.com/teamhitori/logic-agent-platform/blob/main/docs/roadmap.md) — Phased plan (infrastructure phases)
