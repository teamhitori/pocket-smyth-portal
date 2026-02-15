# Architecture — Pocket Smyth Portal

> Comprehensive architecture document for the Portal UI, Control Plane API, and Provisioning Functions.
> For infrastructure-level architecture, see [logic-agent-platform/docs/architecture.md](https://github.com/teamhitori/logic-agent-platform/blob/main/docs/architecture.md).

---

## URL Structure

```
PROD:
  teamhitori.com/pocketsmyth          → Product landing page (Azure SWA, separate repo)
  login.teamhitori.com                → Auth domain: OAuth2-Proxy callback, onboarding, pending screens
  {username}.teamhitori.com           → User portal: trusted shell + Agent Zero iframe
  {username}.teamhitori.com/agent/*   → Agent Zero UI (proxied to user container)
  {username}.teamhitori.com/api/*     → Control Plane API (FastAPI)

DEV:
  login.dev.teamhitori.com            → Dev auth domain
  {username}.dev.teamhitori.com       → Dev user portal
  {username}.dev.teamhitori.com/agent/* → Dev Agent Zero
  {username}.dev.teamhitori.com/api/* → Dev Control Plane API
```

- DEV uses `*.dev.teamhitori.com` wildcard; PROD uses `*.teamhitori.com`. Separate OAuth2-Proxy cookie domains (`.dev.teamhitori.com` vs `.teamhitori.com`).
- One Next.js instance serves ALL subdomains. It reads `request.headers.host` to determine context:
  - `login.*` → auth/onboarding/pending routes
  - `{username}.*` → dashboard with Agent Zero iframe

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

### Auth-Dependent Routing (Next.js Middleware)

| JWT `status` | JWT `role` | Host | Route |
|---|---|---|---|
| `pending` | any | `login.*` | `/pending` (static page) |
| `approved` | any | `login.*` | `/onboarding` (wizard) |
| `active` | `user` | `{username}.*` | `/` (dashboard + iframe) |
| `active` | `admin` | `{username}.*` | `/` or `/admin/*` |
| `revoked` | any | `login.*` | `/revoked` (static page) |

After onboarding completes, the user is redirected from `login.teamhitori.com` to `{username}.teamhitori.com`.

---

## Traefik Routing Rules

All traffic enters via Traefik with TLS termination for `*.teamhitori.com`.

```yaml
# Rule priority (highest to lowest):
# 1. login.teamhitori.com → OAuth2-Proxy → Next.js (auth routes)
# 2. {user}.teamhitori.com/api/* → FastAPI (Control Plane API)
# 3. {user}.teamhitori.com/agent/* → User's Agent Zero container (port from B2C)
# 4. {user}.teamhitori.com/* → OAuth2-Proxy → Next.js (portal shell)
```

| Rule | Target | Auth |
|------|--------|------|
| `Host(login.teamhitori.com)` | OAuth2-Proxy → Next.js | OAuth2-Proxy handles |
| `Host({user}.teamhitori.com) && PathPrefix(/api/)` | FastAPI | JWT validation |
| `Host({user}.teamhitori.com) && PathPrefix(/agent/)` | User container `:PORT` | Cookie (same domain) |
| `Host({user}.teamhitori.com)` | OAuth2-Proxy → Next.js | OAuth2-Proxy handles |

Dynamic per-user routes are configured via Traefik's **file provider**, updated by the Admin Agent when users are provisioned.

---

## Portal UI Architecture

### Trusted Shell + Untrusted Iframe

```
┌─────────────────────────────────────────────────────┐
│  Trusted Shell (Next.js)                            │
│  ┌─────────────────────────────────────────────────┐│
│  │  Header: branding, user menu, logout            ││
│  ├──────────┬──────────────────────────────────────┤│
│  │ Sidebar  │  ┌─────────────────────────────────┐ ││
│  │          │  │  <iframe>                       │ ││
│  │ Dashboard│  │  src="/agent/"                  │ ││
│  │ Settings │  │                                 │ ││
│  │ Admin ▸  │  │  Agent Zero Chat UI             │ ││
│  │          │  │  (same-origin, sandboxed)       │ ││
│  │          │  │                                 │ ││
│  │          │  └─────────────────────────────────┘ ││
│  ├──────────┴──────────────────────────────────────┤│
│  │  Status Bar: agent health, CPU, memory          ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

- **Same-origin iframe:** `{username}.teamhitori.com/agent/` is same origin as the portal shell at `{username}.teamhitori.com/`. Auth cookie covers both.
- **Sandbox attributes:** `allow-scripts allow-same-origin` — Agent Zero needs JS execution and cookie access.
- **If Agent Zero is corrupted:** User sees broken iframe; trusted shell remains intact. Admin can restart the container to restore from immutable image.

### Agent Zero Path Prefix

Agent Zero will be forked to support a `/agent/` path prefix so it can be served at `{username}.teamhitori.com/agent/*` without conflicting with Portal routes.

### Portal Pages

| Page | Route | Who Sees It | Host |
|------|-------|-------------|------|
| Pending screen | `/pending` | `status=pending` | `login.*` |
| Revoked screen | `/revoked` | `status=revoked` | `login.*` |
| Onboarding wizard | `/onboarding` | `status=approved`, no username | `login.*` |
| User dashboard | `/` | Active users | `{user}.*` |
| Admin dashboard | `/admin` | `role=admin` | `{user}.*` |
| Admin: Pending users | `/admin/pending` | Admins | `{user}.*` |
| Admin: User detail | `/admin/users/:id` | Admins | `{user}.*` |

---

## Control Plane API

FastAPI application at `{username}.teamhitori.com/api/*`.

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
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

---

## Container Management Architecture

### Admin Agent (Sidecar Pattern)

```
Control Plane API (FastAPI)
    │
    │  HTTP (portal-net only, shared secret auth)
    ▼
Admin Agent Container
    │
    │  /var/run/docker.sock (mounted)
    ▼
Docker Daemon → manages all user stacks
```

The Admin Agent exposes a scoped REST API on `portal-net` only:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/containers` | GET | List all user containers with status |
| `/containers/:name/stats` | GET | CPU, memory, storage for a container |
| `/containers/:name/restart` | POST | Restart a user's stack |
| `/containers/:name/stop` | POST | Stop a user's stack |
| `/compose/up` | POST | Provision a new user stack from template |
| `/compose/down` | POST | Tear down a user stack |

**Evolution path:**
- **MVP (single VM):** Admin Agent container with `/var/run/docker.sock` mount, HTTP API on `portal-net`.
- **Scale (multi-VM):** Promote to Node Agent pattern — one per VM, reporting to Control Plane via HTTPS.

### Container Image Strategy (AD-5)

- **Immutable:** Agent Zero Docker image is read-only. Container restart = fresh Agent Zero.
- **Mutable:** User data lives on separate mounted volumes at `/data/{username}/`.

**Recovery scenarios:**

| Scenario | Command | Agent Zero | User Data |
|----------|---------|------------|-----------|
| Soft restart | `docker compose restart` | Fresh process | Preserved |
| Hard reset | `docker compose down && up` | Fresh container | Preserved |
| Full restore | Re-provision from scratch | Fresh image | Lost (unless backed up) |

---

## Provisioning Flow

```
Admin approves user (Portal)
    │
    ▼
Control Plane API writes status=approved to B2C (Graph API)
    │
    ▼
User logs in → redirected to onboarding wizard (login.teamhitori.com/onboarding)
    │
    ▼
User completes wizard: username + phone number
    │
    ▼
Portal writes username to B2C → queues provisioning message (Azure Queue Storage)
    │
    ▼
Azure Function reads from queue
    │
    ▼
Function SSHes to VM (key from Azure Key Vault) → runs docker compose up
    │
    ▼
Function updates B2C: status=active, containerPort=XXXX
    │
    ▼
Function updates Traefik file provider (dynamic route for {username}.*)
    │
    ▼
User redirected to {username}.teamhitori.com (dashboard + Agent Zero)
```

### De-provisioning (Revoke/Delete)

- Container stopped, data preserved on disk at `/data/{username}/`
- B2C `status` set to `revoked`
- Traefik route removed
- Manual cleanup required for full data removal (MVP)

---

## Architectural Decisions

### AD-1: Hybrid SSR + Client Polling

Use Next.js Middleware + React Server Components for initial page load (SSR), with client-side polling for live data updates.

- **Middleware:** Decodes JWT from `X-Auth-Request-Access-Token`, extracts `status` and `role`, rewrites to correct route.
- **Server Components:** Fetch initial data from Control Plane API via server-to-server call (same Docker network).
- **Client Components:** Hydrate with server data. Poll `/api/me/agent` every 10s for live agent status.
- **Future:** Replace 10s polling with WebSocket/SSE push.

### AD-2: Portal as Trusted Shell + Agent Zero in Iframe

The Portal UI serves as a trusted wrapper shell. Agent Zero loads in a same-origin `<iframe>` at `/agent/`. The trusted shell (header, sidebar, status, actions) remains intact regardless of what happens inside the user's container.

### AD-3: Admin Agent Container

Dedicated sidecar container with Docker socket access, rather than mounting the socket in the Control Plane API. Separates business logic from Docker operations. Evolves to Node Agent pattern for multi-VM.

### AD-4: Soft Delete Only

User containers and data persist indefinitely. Deletion is flag-based only (`status=revoked`). No automated data destruction in MVP.

### AD-5: Immutable Agent Image + Mutable User Volumes

Agent Zero image is read-only. User data on separate volumes. Restart = fresh Agent Zero + preserved data.

### AD-6: Phone Number Mandatory at Onboarding

Required field in onboarding wizard as an authenticity check. Each account tied to a live phone number.

### AD-7: Username Constraints

- Alphanumeric + hyphens, 4–10 characters, lowercase
- Reserved words blocked: `admin`, `app`, `www`, `api`, `mail`, `portal`, `system`, `root`, `public`, `static`, `login`
- Profanity filter applied
- Uniqueness validated via Graph API

### AD-8: Admin Notifications

Email notification to admin(s) on new sign-up. Admin dashboard shows pending count with approval queue.

### AD-9: MVP Scope Boundaries

| Feature | MVP (10 users) | Post-MVP |
|---------|:-:|:-:|
| SSR + 10s polling | ✅ | WebSocket/SSE |
| Onboarding wizard | ✅ | Extended preferences |
| Admin approval + email | ✅ | Slack/webhook integrations |
| Admin Agent (sidecar) | ✅ | Node Agent (multi-VM) |
| Sequential port allocation | ✅ | Port recycling |
| Soft delete (flag-based) | ✅ | Automated cleanup + backup |
| Rate limiting | ❌ | Per-user rate limits |
| Audit logging | ❌ | SQLite/TimescaleDB |
| Public URL exposure | ❌ | User-configurable routes |
| Container hardening | ❌ | userns, seccomp, AppArmor |
| Agent Zero restore | ❌ | Automated snapshots |

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
- **Queue:** Azure Queue Storage (provisioning messages)
- **Secrets:** Azure Key Vault (SSH keys, B2C secrets)
- **Environments:** DEV and PROD separation in Terraform

---

## Related Documents

- [portal-spec.md](https://github.com/teamhitori/logic-agent-platform/blob/main/docs/portal-spec.md) — Full API spec, UI wireframes, data models
- [architecture.md](https://github.com/teamhitori/logic-agent-platform/blob/main/docs/architecture.md) — Platform-wide system architecture
- [roadmap.md](https://github.com/teamhitori/logic-agent-platform/blob/main/docs/roadmap.md) — Phased plan (this repo covers Phases 3, 4, 6)
