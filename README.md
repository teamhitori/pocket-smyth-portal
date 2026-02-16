# Pocket Smyth Portal

Portal and Admin Agent for the **Pocket Smyth** multi-tenant AI agent platform.

## Overview

This repo contains the user-facing application layer of Pocket Smyth — two TypeScript deployables:

- **Portal** (`portal/`) — Next.js 14 app serving all subdomains: UI + API Routes
- **Admin Agent** (`admin-agent/`) — Hono sidecar for Docker management via dockerode

## URLs

```
login.teamhitori.com                → Auth, onboarding, pending screens
{username}.teamhitori.com           → Portal dashboard
{username}.teamhitori.com/agent/*   → Agent Zero (proxied to user container, opens in new tab)
{username}.teamhitori.com/api/*     → Next.js API Routes
{username}.teamhitori.com/admin/*   → Admin panel (admin users only)
```

## Tech Stack

| Component | Technology | Directory |
|-----------|------------|-----------|
| Portal (UI + API) | Next.js 14, TypeScript, Tailwind CSS | `portal/` |
| Admin Agent | Hono, TypeScript, dockerode | `admin-agent/` |
| Shared Types | TypeScript | `shared/ts/` |
| Auth | Azure AD B2C + OAuth2-Proxy | — |

## Project Structure

```
pocket-smyth-portal/
├── portal/                 # Next.js 14 app (UI + API Routes)
│   ├── src/
│   │   └── app/
│   │       ├── api/        # API Routes (user, admin, system endpoints)
│   │       └── ...         # UI pages
│   ├── public/
│   └── package.json
├── admin-agent/            # Hono sidecar (Docker management)
│   ├── src/
│   └── package.json
├── shared/
│   └── ts/                 # Shared TypeScript types/constants
├── docker-compose.yml      # Local dev (portal + oauth2-proxy + admin-agent)
├── docs/
│   ├── ARCHITECTURE.md     # Full architecture document
│   ├── ROADMAP.md          # Phased feature rollout plan
│   └── AGENT_HANDOFF.md    # Context document for AI agents
└── README.md
```

## Features (MVP)

**For Users:**
- Onboarding wizard (username selection, phone number)
- Agent status dashboard (running/stopped, resource usage)
- Launch Agent button → opens Agent Zero in new tab
- Restart / stop agent from dashboard

**For Admins:**
- Pending user approval queue
- User management (approve, reject, revoke, soft delete)
- System resource overview (CPU, RAM, disk)

## API Routes

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/me` | GET | User | Current user info |
| `/api/me/agent` | GET | User | Agent status |
| `/api/me/agent/restart` | POST | User | Restart own agent |
| `/api/users` | GET | Admin | List all users |
| `/api/users/:id/approve` | POST | Admin | Approve pending user |
| `/api/users/:id/revoke` | POST | Admin | Revoke access |
| `/api/system/status` | GET | Admin | System overview |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for all architectural decisions and technical details.

## Development

### Prerequisites

- Docker & Docker Compose
- A dev B2C app registration with redirect URI `http://localhost:4180/oauth2/callback`

### Setup

```bash
# Copy env file and populate B2C / OAuth2-Proxy credentials
cp .env.example .env

# Start local dev stack (Portal + OAuth2-Proxy + Admin Agent)
docker compose up

# Access via OAuth2-Proxy at http://localhost:4180
# Real B2C login — no mock auth
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `OAUTH2_PROXY_CLIENT_ID` | Dev B2C app registration client ID |
| `OAUTH2_PROXY_CLIENT_SECRET` | Dev B2C app registration client secret |
| `OAUTH2_PROXY_COOKIE_SECRET` | Random 32-byte base64 string for cookie encryption |
| `B2C_TENANT_ID` | Azure AD B2C tenant ID |
| `B2C_GRAPH_CLIENT_ID` | Graph API app registration client ID |
| `B2C_GRAPH_CLIENT_SECRET` | Graph API app registration client secret |
| `ADMIN_AGENT_SECRET` | Shared secret for Portal → Admin Agent auth |

## Deployment

Deployed as Docker containers on the Hetzner VM, routed via Traefik. See [logic-agent-platform](https://github.com/teamhitori/logic-agent-platform) for infrastructure details.

## Related Repositories

| Repository | Purpose |
|---|---|
| [logic-agent-platform](https://github.com/teamhitori/logic-agent-platform) | Infrastructure, IaC, deployment scripts, platform-wide docs |
| [team-hitori-landing](https://github.com/teamhitori/team-hitori-landing) | Static landing page at teamhitori.com |
| [agent-zero](https://github.com/teamhitori/agent-zero) | Agent Zero AI framework (fork) |

---

*Part of the [Pocket Smyth](https://teamhitori.com) platform by [Team Hitori](https://teamhitori.com)*
