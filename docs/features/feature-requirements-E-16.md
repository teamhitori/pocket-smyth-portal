# Feature Requirements — E-16: Production Launch & Verification

> Ensure the portal is correctly configured for production and that the full user journey works flawlessly on `*.teamhitori.com` at target scale. This is the final validation before inviting real users.

> **Scope note:** This file covers the **portal application portion** of E-16. Infrastructure deployment and verification (VM, Traefik, secrets, TLS) are owned by `logic-agent-platform`.

| Field | Value |
|-------|-------|
| **Epic** | E-16 |
| **Release** | R4 — Production Launch |
| **Status** | Backlog |

---

## Feature Summary

| ID | Title | Type | Priority | SP | Status |
|----|-------|------|----------|----|--------|
| E16-F01 | Production Application Configuration | Non-Functional | Must | 3 | Backlog |
| E16-F02 | Production End-to-End Verification | Non-Functional | Must | 8 | Backlog |

**Total Story Points: 11**

---

## Features

### E16-F01: Production Application Configuration

| Field | Value |
|-------|-------|
| **ID** | E16-F01 |
| **Epic** | E-16 |
| **Release** | R4 |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 3 |
| **Status** | Backlog |

**Description:**
As the operations team, I want the portal configured for the production environment so that authentication callbacks, cookie domains, and routing all reference the production domain.

**Acceptance Criteria:**
- [ ] OAuth2-Proxy callback URL set to `login.teamhitori.com/oauth2/callback`
- [ ] Cookie domain set to `.teamhitori.com` (covers all production subdomains)
- [ ] B2C redirect URIs updated for production domain
- [ ] Production `.env` file populated with production secrets (separate from DEV)
- [ ] Environment-specific configuration (DEV vs PROD) managed cleanly (no hardcoded URLs)
- [ ] DEV and PROD are fully isolated: separate cookie domains, separate redirect URIs, no cross-environment leakage

---

### E16-F02: Production End-to-End Verification

| Field | Value |
|-------|-------|
| **ID** | E16-F02 |
| **Epic** | E-16 |
| **Release** | R4 |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 8 |
| **Status** | Backlog |

**Description:**
As the project team, I want to run the complete user lifecycle on production with 10 concurrent users so that we can confirm the platform works at target scale in the real environment.

**Acceptance Criteria:**
- [ ] New user signs up via `teamhitori.com` → B2C → pending screen at `login.teamhitori.com/pending`
- [ ] Admin approves → user completes onboarding → agent provisioned → dashboard loads at `{username}.teamhitori.com`
- [ ] Launch Agent → Agent Zero opens in new tab at `{username}.teamhitori.com/agent/`
- [ ] Admin revokes → user sees `/revoked` page, agent stopped
- [ ] Subdomain validation blocks cross-user access
- [ ] 10 users running simultaneously on CPX31 (8 GB RAM) without resource exhaustion
- [ ] TLS certificates valid for all accessed subdomains
- [ ] Email delivery (MX records) unaffected — existing email still works
- [ ] `teamhitori.com` landing page continues to load correctly (SWA CDN, not affected by VM)
