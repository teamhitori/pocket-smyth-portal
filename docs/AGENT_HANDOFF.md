# Agent Handoff — pocket-smyth-portal

Context document for AI agents continuing work on this repo.

## Project Summary

**Pocket Smyth Portal** is the user-facing application layer for the Pocket Smyth multi-tenant AI agent platform:

- **Portal UI** (`portal/`) — Next.js 14, serves `login.teamhitori.com` and `{username}.teamhitori.com`
- **Control Plane API** (`api/`) — FastAPI at `{username}.teamhitori.com/api/*`
- **Provisioning Functions** (`functions/`) — Azure Functions triggered by Azure Queue Storage

## Current State

| Component | Status |
|-----------|--------|
| Architecture decisions (AD-1–AD-9) | ✅ Finalized |
| Architecture document | ✅ `docs/ARCHITECTURE.md` |
| Portal UI scaffolded | ⬜ Not started |
| Control Plane API scaffolded | ⬜ Not started |
| Azure Functions scaffolded | ⬜ Not started |
| docker-compose.yml for local dev | ⬜ Not started |

## Quick Reference

```
login.teamhitori.com              → Auth, onboarding, pending screens (this repo)
{username}.teamhitori.com         → Portal shell + Agent Zero iframe (this repo)
{username}.teamhitori.com/api/*   → Control Plane API (this repo)
{username}.teamhitori.com/agent/* → Agent Zero container (per-user)
teamhitori.com/pocketsmyth        → Product landing page (Azure SWA, separate repo)
```

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
| `docs/ARCHITECTURE.md` | URL structure, auth flow, Traefik routing, portal layout, API endpoints, container management, provisioning, security model, all architectural decisions (AD-1–AD-9) |
| [portal-spec.md](https://github.com/teamhitori/logic-agent-platform/blob/main/docs/portal-spec.md) | Full API spec, UI wireframes, data models |
| [architecture.md](https://github.com/teamhitori/logic-agent-platform/blob/main/docs/architecture.md) | Platform-wide system architecture |
| [roadmap.md](https://github.com/teamhitori/logic-agent-platform/blob/main/docs/roadmap.md) | Phased plan (this repo = Phases 3, 4, 6) |

## Related Repos

| Repository | Purpose |
|---|---|
| [logic-agent-platform](https://github.com/teamhitori/logic-agent-platform) | Infrastructure, IaC, Traefik, Docker Compose templates |
| [team-hitori-landing](https://github.com/teamhitori/team-hitori-landing) | Landing page at `teamhitori.com` |
| [agent-zero](https://github.com/teamhitori/agent-zero) | Agent Zero AI framework (fork — modified for `/agent/` path prefix) |

## How to Resume

1. Read this file for project context and credentials
2. Read `docs/ARCHITECTURE.md` for all architectural decisions and technical details
3. Read `logic-agent-platform/docs/portal-spec.md` for the full API spec
4. Next steps: scaffold `portal/`, `api/`, `functions/`, and `shared/` directories
