# Feature Requirements — E-08: Environment Infrastructure (Portal)

> Portal-side infrastructure integration that complements logic-agent-platform's E-08 (gateway stack, DNS, TLS, routing).

| Field | Value |
|-------|-------|
| **Epic** | E-08 |
| **Release** | R2 — Portal + Agent on DEV |
| **Status** | Backlog |

---

## Feature Summary

| ID | Title | Type | Priority | SP | Status |
|----|-------|------|----------|----|--------|
| E08-F01 | B2C Redirect URI Registration | Non-Functional | Must | 1 | Backlog |
| E08-F02 | Deployed Environment Compose | Non-Functional | Must | 3 | Backlog |

**Total Story Points: 4**

---

## Features

### E08-F01: B2C Redirect URI Registration

| Field | Value |
|-------|-------|
| **ID** | E08-F01 |
| **Epic** | E-08 |
| **Release** | R2 |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 1 |
| **Status** | Backlog |

**Description:**
As a **developer**, I want the Azure AD B2C app registration updated with redirect URIs for both environments, so that OAuth2-Proxy can complete the OIDC authentication flow on DEV and PROD.

**Acceptance Criteria:**
- [ ] `https://login.dev.teamhitori.com/oauth2/callback` added as a redirect URI in the B2C app registration
- [ ] `https://login.teamhitori.com/oauth2/callback` confirmed as a redirect URI (replacing any stale `agentzero.teamhitori.com` URIs)
- [ ] Stale redirect URIs removed
- [ ] OAuth2-Proxy on DEV can complete the B2C login flow end-to-end

**Dependencies:** logic-agent-platform E-08 F-08-01 (wildcard DNS must resolve), E-02 (B2C app registration must exist).

---

### E08-F02: Deployed Environment Compose

| Field | Value |
|-------|-------|
| **ID** | E08-F02 |
| **Epic** | E-08 |
| **Release** | R2 |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 3 |
| **Status** | Backlog |

**Description:**
As a **developer**, I want a Docker Compose definition for deploying Portal and Admin Service onto the gateway stack in DEV and PROD environments, so that the portal services integrate with the Traefik + OAuth2-Proxy gateway managed by logic-agent-platform.

**Acceptance Criteria:**
- [ ] Compose file defines Portal (Next.js) and Admin Service (Hono) services for deployed environments
- [ ] Services connect to `agent-network` (external network created by the gateway stack)
- [ ] Admin Service has Docker socket mount (`/var/run/docker.sock`) for container management
- [ ] Configuration is parameterised via `.env` variables — same file works on DEV and PROD
- [ ] Separate from the local dev `docker-compose.yml` (which runs its own OAuth2-Proxy and token-proxy)
- [ ] Portal and Admin Service containers can be updated without reconfiguring the gateway

**Dependencies:** logic-agent-platform E-08 F-08-03 (gateway stack must be deployed with `agent-network`).
