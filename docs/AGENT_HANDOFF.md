# Agent Handoff — pocket-smyth-portal

Context document for AI agents continuing work on this repo.

## Project Summary

**Pocket Smyth Portal** is the user-facing application layer for a multi-tenant AI agent platform. Two TypeScript deployables plus a lightweight sidecar:

- **Portal** (`portal/`) — Next.js 14, serves `login.teamhitori.com` and `{username}.teamhitori.com`. Contains both UI and API Routes.
- **Admin Agent** (`admin-agent/`) — Hono, Docker management sidecar via dockerode. Runs on `portal-net` only.
- **Token Proxy** (`token-proxy/`) — Node.js sidecar that fixes B2C token exchange (adds `scope` parameter that the Go oauth2 library omits).

No Python. No Azure Functions. No separate API service.

## Current State

| Component | Status |
|-----------|--------|
| Architecture decisions (AD-1–AD-13) | ✅ Finalized |
| Architecture document | ✅ `docs/ARCHITECTURE.md` |
| Roadmap | ✅ `docs/ROADMAP.md` (6 phases) |
| Old code removed | ✅ `api/`, `functions/`, `shared/python/`, `ruff.toml`, `mock-auth/` deleted |
| Portal scaffolded | ✅ Next.js 14 with API route stubs |
| Admin Agent scaffolded | ✅ Hono project with dockerode |
| Token Proxy | ✅ B2C token exchange workaround (`token-proxy/proxy.js`) |
| docker-compose.yml | ✅ 4 services: oauth2-proxy, portal, admin-agent, token-proxy |
| B2C dev app registration | ✅ With exposed API scope `access_as_user` |
| Local dev auth (Checkpoint 1D) | ✅ B2C login → Portal loads successfully |

## Key Architectural Decisions

| # | Decision |
|---|---|
| AD-1 | Hybrid SSR + client polling (10s) |
| AD-2 | Launch button → new tab (not iframe) |
| AD-3 | Admin Agent: Hono + dockerode sidecar |
| AD-4 | Soft delete only |
| AD-5 | Immutable agent image + mutable user volumes |
| AD-10 | TypeScript only — no Python |
| AD-11 | API Routes inside Next.js (no separate API service) |
| AD-12 | Synchronous provisioning (API → Admin Agent HTTP) |
| AD-13 | No database for MVP (B2C + Docker state) |

## Quick Reference

```
login.teamhitori.com              → Auth, onboarding, pending screens
{username}.teamhitori.com         → Portal dashboard
{username}.teamhitori.com/agent/* → Agent Zero (new tab, proxied to user container)
{username}.teamhitori.com/api/*   → Next.js API Routes
{username}.teamhitori.com/admin/* → Admin panel (admin only)
```

## Local Dev

Real OAuth2-Proxy + dev B2C app registration. No mock auth.

```
localhost:4180 → OAuth2-Proxy → localhost:3000 (Portal)
                     │
                     └─ token exchange → Token Proxy (:8888) → B2C
```

Four containers: `oauth2-proxy`, `portal`, `admin-agent`, `token-proxy`.
No subdomain routing locally. Subdomain routing tested on DEV (`*.dev.teamhitori.com`).

### B2C Workarounds

- **Token Proxy** — B2C requires `scope` in the token exchange POST body but the Go oauth2 library doesn't send it. Token Proxy intercepts, appends scope, forwards to B2C.
- **Email claim** — B2C uses `emails` (array) not `email` (string). Set via `OAUTH2_PROXY_OIDC_EMAIL_CLAIM=emails`.
- **Email verified** — B2C omits `email_verified` claim. Set via `OAUTH2_PROXY_INSECURE_OIDC_ALLOW_UNVERIFIED_EMAIL=true`.
- **API scope** — B2C only issues an `access_token` when an API scope is requested. App registration must have **Expose an API** configured with scope `access_as_user`.

## Credentials

### B2C Custom Attributes

```
Extension prefix: extension_3575970a911e4699ad1ccc1a507d2312_
Attributes: Status (pending|approved|active|revoked), Role (user|admin), Username, ContainerPort
```

### B2C Graph API

```
Tenant ID:        359dc45f-49b6-4472-92f1-092556a84a98
Graph Client ID:  6c50fb10-e1d2-4ca7-be00-6cb29b7f474b
Secret:           .env → B2C_GRAPH_CLIENT_SECRET
```

### Infrastructure

```
VM:  Hetzner CPX31, IP 178.156.214.79
DNS: Azure DNS, wildcard *.teamhitori.com → VM
```

## Key Documents

| Document | Contents |
|----------|----------|
| `docs/ARCHITECTURE.md` | URL structure, auth flow, local dev auth, Traefik routing, portal layout, API routes, Admin Agent, provisioning, security model, all ADs |
| `docs/ROADMAP.md` | 6-phase rollout plan |
| [portal-spec.md](https://github.com/teamhitori/logic-agent-platform/blob/main/docs/portal-spec.md) | Full API spec, UI wireframes, data models |
| [architecture.md](https://github.com/teamhitori/logic-agent-platform/blob/main/docs/architecture.md) | Platform-wide system architecture |

## Related Repos

| Repository | Purpose |
|---|---|
| [logic-agent-platform](https://github.com/teamhitori/logic-agent-platform) | Infrastructure, IaC, Traefik, Docker Compose templates |
| [team-hitori-landing](https://github.com/teamhitori/team-hitori-landing) | Landing page at `teamhitori.com` |
| [agent-zero](https://github.com/teamhitori/agent-zero) | Agent Zero AI framework (fork — modified for `/agent/` path prefix) |

## How to Resume

1. Read this file for project context and credentials
2. Read `docs/ARCHITECTURE.md` for all architectural decisions
3. Read `docs/ROADMAP.md` for current phase and next tasks
4. **Current state:** Phase 1 Checkpoint 1D is complete. Next: Checkpoint 1E (manual E2E auth verification), then Phase 2 (Portal UI MVP)
5. Run `docker compose up` to start all 4 services. Open `http://localhost:4180` to test.
