# Agent Handoff — pocket-smyth-portal

Context document for AI agents continuing work on this repo.

## Project Summary

**Pocket Smyth Portal** is the user-facing application layer for a multi-tenant AI agent platform. Two TypeScript deployables:

- **Portal** (`portal/`) — Next.js 14, serves `login.teamhitori.com` and `{username}.teamhitori.com`. Contains both UI and API Routes.
- **Admin Agent** (`admin-agent/`) — Hono, Docker management sidecar via dockerode. Runs on `portal-net` only.

No Python. No Azure Functions. No separate API service.

## Current State

| Component | Status |
|-----------|--------|
| Architecture decisions (AD-1–AD-13) | ✅ Finalized |
| Architecture document | ✅ `docs/ARCHITECTURE.md` |
| Roadmap | ✅ `docs/ROADMAP.md` (6 phases) |
| Portal scaffolded | ⬜ Pending restructure (exists from old Phase 1, needs Python removal + API routes) |
| Admin Agent scaffolded | ⬜ Not started |
| docker-compose.yml | ⬜ Pending restructure (needs OAuth2-Proxy, remove api service) |
| Old code to remove | ⬜ `api/`, `functions/`, `shared/python/`, `ruff.toml`, `mock-auth/` |

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
```

No subdomain routing locally. Subdomain routing tested on DEV (`*.dev.teamhitori.com`).

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
4. Next code tasks: delete old Python code (`api/`, `functions/`, `shared/python/`, `ruff.toml`, `mock-auth/`), scaffold `admin-agent/`, add Next.js API route stubs, update `docker-compose.yml` with OAuth2-Proxy
