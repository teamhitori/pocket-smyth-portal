# Pocket Smyth Portal

Portal UI, Control Plane API, and provisioning workers for the **Pocket Smyth** multi-tenant AI agent platform.

## Overview

This repo contains the user-facing application layer of Pocket Smyth:

- **Portal UI** — User dashboard, admin panel, onboarding wizard
- **Control Plane API** — REST API for user/agent/stack management
- **Provisioning Functions** — Azure Functions for async user stack provisioning

## URLs

```
login.teamhitori.com                → Auth, onboarding, pending screens
{username}.teamhitori.com           → Portal shell + Agent Zero iframe
{username}.teamhitori.com/api/*     → Control Plane API
{username}.teamhitori.com/agent/*   → Agent Zero (proxied to user container)
```

## Tech Stack

| Component | Technology | Directory |
|-----------|------------|-----------|
| Portal UI | Next.js 14 | `portal/` |
| Control Plane API | FastAPI (Python) | `api/` |
| Provisioning Worker | Azure Functions | `functions/` |
| Shared Types | TypeScript/Python | `shared/` |

## Project Structure

```
pocket-smyth-portal/
├── portal/                 # Next.js 14 app
│   ├── src/
│   ├── public/
│   └── package.json
├── api/                    # FastAPI control plane
│   ├── app/
│   ├── requirements.txt
│   └── Dockerfile
├── functions/              # Azure Functions (provisioning)
├── shared/                 # Shared types/constants
├── docker-compose.yml      # Local dev (portal + api)
├── docs/                   # Project-specific docs
└── README.md               # This file
```

## Features

### Portal UI (`portal/`)

**For Users:**
- Onboarding wizard (username selection, preferences)
- Agent status dashboard (running/stopped, resource usage)
- "Launch Agent" button → redirect to `{username}.teamhitori.com`
- Public URL toggle for `/public/*` endpoints

**For Admins:**
- Pending user approval queue
- User management (approve, reject, revoke, delete)
- System resource overview (CPU, RAM, disk)
- Activity log

### Control Plane API (`api/`)

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/me` | GET | User | Current user info |
| `/api/me/agent` | GET | User | Agent status |
| `/api/me/agent/restart` | POST | User | Restart own agent |
| `/api/users` | GET | Admin | List all users |
| `/api/users/:id/approve` | POST | Admin | Approve pending user |
| `/api/users/:id/reject` | POST | Admin | Reject user |
| `/api/users/:id/revoke` | POST | Admin | Revoke access |
| `/api/system/status` | GET | Admin | System overview |

See [logic-agent-platform/docs/portal-spec.md](https://github.com/teamhitori/logic-agent-platform/blob/main/docs/portal-spec.md) for the full API specification.
See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for all architectural decisions and technical details.

### Provisioning Functions (`functions/`)

Azure Functions triggered by Azure Queue Storage messages to:
1. SSH to VM
2. Run `provision-user.sh` from `logic-agent-platform`
3. Update B2C custom attributes via Graph API
4. Send confirmation email

## Related Repositories

| Repository | Purpose |
|---|---|
| [logic-agent-platform](https://github.com/teamhitori/logic-agent-platform) | Infrastructure, IaC, deployment scripts, platform-wide docs |
| [team-hitori-landing](https://github.com/teamhitori/team-hitori-landing) | Static landing page at teamhitori.com |
| [agent-zero](https://github.com/teamhitori/agent-zero) | Agent Zero AI framework (fork) |

## Development

```bash
# Start everything locally
docker compose up

# Or individually:

# Portal (Next.js)
cd portal && npm install && npm run dev

# API (FastAPI)
cd api && pip install -r requirements.txt && uvicorn app.main:app --reload
```

## Deployment

Deployed as Docker containers on the Hetzner VM, routed via Traefik. See [logic-agent-platform](https://github.com/teamhitori/logic-agent-platform) for infrastructure details.

---

*Part of the [Pocket Smyth](https://teamhitori.com) platform by [Team Hitori](https://teamhitori.com)*
