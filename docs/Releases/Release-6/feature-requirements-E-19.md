# Feature Requirements — E-19: Resilience & Security Hardening

> Harden the portal for production use — health checks for automated recovery, friendly error pages for users, security headers to protect against browser-based attacks, and performance tuning to keep the experience snappy.

| Field | Value |
|-------|-------|
| **Epic** | E-19 |
| **Release** | R6 — Polish & Production Readiness |
| **Status** | Backlog |

---

## Feature Summary

| ID | Title | Type | Priority | SP | Status |
|----|-------|------|----------|----|--------|
| E19-F01 | Health Check Endpoints | Non-Functional | Must | 3 | Backlog |
| E19-F02 | Graceful Error Pages | Functional | Must | 3 | Backlog |
| E19-F03 | Security Headers | Non-Functional | Must | 3 | Backlog |
| E19-F04 | Performance Optimisation | Non-Functional | Should | 5 | Backlog |

**Total Story Points: 14**

---

## Features

### E19-F01: Health Check Endpoints

| Field | Value |
|-------|-------|
| **ID** | E19-F01 |
| **Epic** | E-19 |
| **Release** | R6 |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 3 |
| **Status** | Backlog |

**Description:**
As the operations team, I want liveness and readiness probes exposed by the portal so that Docker and Traefik can detect failures and route traffic only to healthy instances.

**Acceptance Criteria:**
- [ ] `GET /api/health` — liveness probe, returns 200 if the process is running
  - Lightweight, no external dependencies checked
  - Response body: `{ "status": "ok", "uptime": <seconds> }`
- [ ] `GET /api/ready` — readiness probe, returns 200 only if dependencies are reachable
  - Checks: Admin Agent health endpoint reachable
  - Checks: B2C Graph API token obtainable (cached check, not on every request)
  - Returns 503 with details if any dependency is unreachable
- [ ] Both endpoints do not require authentication (accessible directly, bypassing OAuth2-Proxy)
- [ ] Response times under 500ms

---

### E19-F02: Graceful Error Pages

| Field | Value |
|-------|-------|
| **ID** | E19-F02 |
| **Epic** | E-19 |
| **Release** | R6 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 3 |
| **Status** | Backlog |

**Description:**
As a user, I want to see friendly, branded error pages when something goes wrong so that I get useful guidance instead of raw technical error messages.

**Acceptance Criteria:**
- [ ] Custom 404 (Not Found) page with navigation back to the dashboard
- [ ] Custom 500 (Server Error) page with a "try again" suggestion and support contact
- [ ] Custom auth error page for authentication/authorisation failures
- [ ] All error pages use the portal's visual design (header, colours, typography)
- [ ] No stack traces, file paths, or technical details exposed to the user
- [ ] Error pages work when JavaScript is disabled (SSR-rendered)

---

### E19-F03: Security Headers

| Field | Value |
|-------|-------|
| **ID** | E19-F03 |
| **Epic** | E-19 |
| **Release** | R6 |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 3 |
| **Status** | Backlog |

**Description:**
As the security team, I want appropriate HTTP security headers on all portal responses so that the application is protected against common browser-based attack vectors.

**Acceptance Criteria:**
- [ ] `Content-Security-Policy` configured to restrict script/style/image sources
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY` (portal should not be embedded in iframes)
- [ ] `Strict-Transport-Security` with appropriate max-age (HSTS)
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] CORS policy restricts allowed origins to portal domains
- [ ] Headers verified against OWASP recommendations
- [ ] Headers do not break Agent Zero functionality when opened in a new tab (same-origin)

---

### E19-F04: Performance Optimisation

| Field | Value |
|-------|-------|
| **ID** | E19-F04 |
| **Epic** | E-19 |
| **Release** | R6 |
| **Type** | Non-Functional |
| **Priority** | Should |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As a user, I want the portal to load quickly and feel responsive so that the dashboard and admin panel are pleasant to use even on slower connections.

**Acceptance Criteria:**
- [ ] Dashboard initial page load under 2 seconds on a broadband connection
- [ ] JavaScript bundle size audited and tree-shaken (no unnecessary dependencies)
- [ ] Server-side rendering (SSR) used for initial page load (per AD-1)
- [ ] Static assets cached with appropriate `Cache-Control` headers
- [ ] API response times for `/api/me` and `/api/me/agent` under 500ms
- [ ] Lighthouse Performance score 85+ on dashboard page
- [ ] No layout shift during hydration (CLS < 0.1)
