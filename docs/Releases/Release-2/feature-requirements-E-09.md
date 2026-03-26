# Feature Requirements — E-09: Portal Middleware & Auth Routing

> Build the portal's "traffic controller" — the middleware that inspects each request, identifies the user, and routes them to the correct experience based on their account status and subdomain.

| Field | Value |
|-------|-------|
| **Epic** | E-09 |
| **Release** | R2 — Portal + Agent on DEV |
| **Status** | Backlog |

---

## Feature Summary

| ID | Title | Type | Priority | SP | Status |
|----|-------|------|----------|----|--------|
| E09-F01 | JWT Claim Extraction Middleware | Functional | Must | 5 | Backlog |
| E09-F02 | Host-Based Route Resolution | Functional | Must | 5 | Backlog |
| E09-F03 | Status-Driven Page Routing | Functional | Must | 5 | Backlog |
| E09-F04 | Subdomain Ownership Validation | Functional | Must | 3 | Backlog |
| E09-F05 | Local Dev Routing Bypass | Non-Functional | Must | 2 | Backlog |

**Total Story Points: 20**

---

## Features

### E09-F01: JWT Claim Extraction Middleware

| Field | Value |
|-------|-------|
| **ID** | E09-F01 |
| **Epic** | E-09 |
| **Release** | R2 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As the portal, I want to decode the authenticated user's identity from every incoming request so that all downstream pages and API routes can make decisions based on who the user is and what their account status is.

**Acceptance Criteria:**
- [ ] Next.js middleware at `portal/src/middleware.ts` runs on every request
- [ ] Extracts JWT from the `X-Auth-Request-Access-Token` header (injected by OAuth2-Proxy)
- [ ] Base64-decodes the JWT payload (no cryptographic verification — OAuth2-Proxy is the trust boundary)
- [ ] Extracts `status`, `role`, and `username` from the B2C extension claims (prefix: `extension_3575970a911e4699ad1ccc1a507d2312_`)
- [ ] Makes extracted claims available to downstream route handlers
- [ ] Gracefully handles missing or malformed tokens (redirect to login)

---

### E09-F02: Host-Based Route Resolution

| Field | Value |
|-------|-------|
| **ID** | E09-F02 |
| **Epic** | E-09 |
| **Release** | R2 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As the portal, I want to determine the request context from the Host header so that `login.teamhitori.com` serves auth-related pages while `{username}.teamhitori.com` serves the user's dashboard.

**Acceptance Criteria:**
- [ ] Reads `request.headers.host` to determine context
- [ ] `login.*` hosts route to auth flows (`/pending`, `/onboarding`, `/revoked`)
- [ ] `{username}.*` hosts route to dashboard flows (`/`, `/admin/*`, `/api/*`)
- [ ] Supports both DEV (`*.dev.teamhitori.com`) and PROD (`*.teamhitori.com`) patterns
- [ ] Unknown or invalid subdomains result in a redirect to the login domain

---

### E09-F03: Status-Driven Page Routing

| Field | Value |
|-------|-------|
| **ID** | E09-F03 |
| **Epic** | E-09 |
| **Release** | R2 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As a user, I want to be automatically directed to the right page for my account status so that I always see the experience appropriate to where I am in the lifecycle — whether I'm awaiting approval, setting up my account, using my agent, or have been revoked.

**Acceptance Criteria:**
- [ ] `status=pending` on `login.*` → rewrite to `/pending`
- [ ] `status=approved` on `login.*` → rewrite to `/onboarding`
- [ ] `status=active` + `role=user` on `{username}.*` → allow through to `/` (dashboard)
- [ ] `status=active` + `role=admin` on `{username}.*` → allow through to `/` or `/admin/*`
- [ ] `status=revoked` on `login.*` → rewrite to `/revoked`
- [ ] Users cannot navigate to pages outside their status (e.g., a pending user cannot access the dashboard)

---

### E09-F04: Subdomain Ownership Validation

| Field | Value |
|-------|-------|
| **ID** | E09-F04 |
| **Epic** | E-09 |
| **Release** | R2 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 3 |
| **Status** | Backlog |

**Description:**
As a user, I want the portal to verify that I can only access my own subdomain so that no one can view or control my agent by navigating to my personal URL.

**Acceptance Criteria:**
- [ ] For `{username}.*` hosts, the JWT `username` claim must match the subdomain
- [ ] Mismatch results in a redirect to the user's correct subdomain (`{jwt-username}.teamhitori.com`)
- [ ] Admin users follow the same rule (admins access their own subdomain; admin features are at `{admin-username}.teamhitori.com/admin/*`)

---

### E09-F05: Local Dev Routing Bypass

| Field | Value |
|-------|-------|
| **ID** | E09-F05 |
| **Epic** | E-09 |
| **Release** | R2 |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 2 |
| **Status** | Backlog |

**Description:**
As a developer, I want the middleware to work on localhost without subdomains so that I can develop and test locally using `localhost:4180` where subdomain routing is not available.

**Acceptance Criteria:**
- [ ] On `localhost` (or non-production hosts), subdomain extraction and validation are skipped
- [ ] Status-driven routing still functions on localhost (status → page mapping works)
- [ ] All pages are accessible for testing regardless of subdomain context
- [ ] Behaviour is controlled by environment detection, not a feature flag
