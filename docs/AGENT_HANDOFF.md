# Agent Handoff — pocket-smyth-portal

This document provides context for an AI agent working on this repo.

## Project Summary

**Pocket Smyth Portal** is the user-facing application layer for the Pocket Smyth multi-tenant AI agent platform. It contains:

- **Portal UI** (`portal/`) — Next.js 14 app at `app.teamhitori.com`
- **Control Plane API** (`api/`) — FastAPI at `app.teamhitori.com/api`
- **Provisioning Functions** (`functions/`) — Azure Functions for async user stack creation

## Current State

| Component | Status |
|-----------|--------|
| Repository created | ✅ |
| Portal UI scaffolded | ⬜ Not started |
| Control Plane API scaffolded | ⬜ Not started |
| Azure Functions scaffolded | ⬜ Not started |
| docker-compose.yml for local dev | ⬜ Not started |

## Architecture Context

```
teamhitori.com                    → team-hitori-landing (separate repo)
app.teamhitori.com               → THIS REPO: Portal UI
app.teamhitori.com/api           → THIS REPO: Control Plane API
{username}.teamhitori.com        → Per-user Agent Zero (managed by logic-agent-platform)
```

### Authentication

- **Provider:** Azure AD B2C (`teamhitorib2c.onmicrosoft.com`)
- **Identity Providers:** Google, GitHub, Microsoft
- **Auth Proxy:** OAuth2-Proxy sits in front of both Portal and user subdomains (managed in `logic-agent-platform`)
- **JWT:** OAuth2-Proxy passes `X-Auth-Request-Access-Token` header to this app

### User Lifecycle

```
sign-up → pending → [admin approves] → approved → [onboarding wizard] → active
```

Status is stored in Azure AD B2C custom attributes, managed via Microsoft Graph API.

### B2C Custom Attributes

```
Extension prefix: extension_3575970a911e4699ad1ccc1a507d2312_
Attributes: Status, Role, Username, ContainerPort
```

- **Status:** `pending` | `approved` | `active` | `revoked`
- **Role:** `user` | `admin`
- **Username:** URL-safe slug (e.g., `reuben`)
- **ContainerPort:** internal port for user's Docker stack (e.g., `8001`)

### B2C Graph API Credentials

```
Tenant ID: 359dc45f-49b6-4472-92f1-092556a84a98
Graph Client ID: 6c50fb10-e1d2-4ca7-be00-6cb29b7f474b
Secret: stored in .env as B2C_GRAPH_CLIENT_SECRET
```

## Key Design Documents

The full API spec and UI mockups live in the platform-wide docs:

- **[portal-spec.md](https://github.com/teamhitori/logic-agent-platform/blob/main/docs/portal-spec.md)** — Complete API endpoints, UI wireframes, data models
- **[architecture.md](https://github.com/teamhitori/logic-agent-platform/blob/main/docs/architecture.md)** — System architecture, request flows, security model
- **[roadmap.md](https://github.com/teamhitori/logic-agent-platform/blob/main/docs/roadmap.md)** — Phased plan (this repo covers Phases 3, 4, 6)

## Portal UI Pages

| Page | Route | Who Sees It |
|------|-------|-------------|
| Pending screen | `/` | Users with `status=pending` |
| Onboarding wizard | `/onboarding` | Users with `status=approved` and no username |
| User dashboard | `/` | Active users |
| Admin dashboard | `/admin` | Users with `role=admin` |
| Admin: Pending users | `/admin/pending` | Admins |
| Admin: User detail | `/admin/users/:id` | Admins |

## Control Plane API Endpoints

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/me` | GET | User | Current user info (from B2C via Graph) |
| `/api/me/agent` | GET | User | Agent container status |
| `/api/me/agent/restart` | POST | User | Restart own agent |
| `/api/me/settings` | PUT | User | Update settings (e.g., public URLs) |
| `/api/users` | GET | Admin | List all users |
| `/api/users/:id/approve` | POST | Admin | Approve pending user |
| `/api/users/:id/reject` | POST | Admin | Reject user |
| `/api/users/:id/revoke` | POST | Admin | Revoke access |
| `/api/users/:id` | DELETE | Admin | Delete user + purge data |
| `/api/system/status` | GET | Admin | System resource overview |
| `/api/system/config` | GET/PUT | Admin | System configuration |

## Related Repos

- **[logic-agent-platform](https://github.com/teamhitori/logic-agent-platform)** — Infrastructure, platform-wide docs, deployment scripts, Docker Compose templates
- **[team-hitori-landing](https://github.com/teamhitori/team-hitori-landing)** — Static landing page at `teamhitori.com`
- **[agent-zero](https://github.com/teamhitori/agent-zero)** — Agent Zero AI framework (fork)

## How to Resume Work

```
Read docs/AGENT_HANDOFF.md for project context.
This is the Pocket Smyth Portal — Portal UI, Control Plane API, and provisioning workers.
See logic-agent-platform/docs/portal-spec.md for the full API spec and UI wireframes.
See logic-agent-platform/docs/architecture.md for system architecture.
```
