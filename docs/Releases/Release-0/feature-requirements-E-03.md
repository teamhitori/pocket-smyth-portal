# Feature Requirements — E-03: Portal Repo Cleanup & Scaffolding

> Establish a clean TypeScript-only project structure with working local development authentication.

| Field | Value |
|-------|-------|
| **Epic** | E-03 |
| **Release** | Foundation |
| **Status** | Done |

---

## Feature Summary

| ID | Title | Type | Priority | SP | Status |
|----|-------|------|----------|----|--------|
| E03-F01 | Legacy Code Removal | Non-Functional | Must | 3 | Done |
| E03-F02 | Portal Project Scaffolding | Non-Functional | Must | 5 | Done |
| E03-F03 | Admin Agent Project Scaffolding | Non-Functional | Must | 3 | Done |
| E03-F04 | Shared Type Library | Non-Functional | Must | 2 | Done |
| E03-F05 | Local Development Stack | Non-Functional | Must | 8 | Done |
| E03-F06 | B2C Token Exchange Compatibility | Non-Functional | Must | 5 | Done |
| E03-F07 | End-to-End Auth Verification | Non-Functional | Must | 3 | Done |

**Total Story Points: 29**

---

## Features

### E03-F01: Legacy Code Removal

| Field | Value |
|-------|-------|
| **ID** | E03-F01 |
| **Epic** | E-03 |
| **Release** | Foundation |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 3 |
| **Status** | Done |

**Description:**
As a developer, I want all legacy Python code removed from the repository so that the project has a clean TypeScript-only codebase with no dead code or conflicting tooling.

**Acceptance Criteria:**
- [x] `api/` directory (old FastAPI project) deleted
- [x] `functions/` directory (old Azure Functions project) deleted
- [x] `shared/python/` directory deleted
- [x] `mock-auth/` directory (replaced by real OAuth2-Proxy) deleted
- [x] `ruff.toml` (Python linter config) deleted
- [x] Python-specific environment variables removed from `.env.example`
- [x] `api` and `mock-auth` services removed from `docker-compose.yml`
- [x] No remaining Python references in `.yml`, `.json`, or `.ts` files (verified via `grep`)

---

### E03-F02: Portal Project Scaffolding

| Field | Value |
|-------|-------|
| **ID** | E03-F02 |
| **Epic** | E-03 |
| **Release** | Foundation |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 5 |
| **Status** | Done |

**Description:**
As a developer, I want a properly scaffolded Next.js 14 project with TypeScript, Tailwind CSS, and App Router so that I have a modern, well-structured foundation for building the portal UI and API routes.

**Acceptance Criteria:**
- [x] `portal/` directory contains a Next.js 14 project with App Router (`src/app/`)
- [x] TypeScript configured with strict mode
- [x] Tailwind CSS integrated with PostCSS
- [x] API route stub directories created under `src/app/api/` matching the planned endpoint structure
- [x] ESLint and Prettier configured for consistent code style
- [x] `npm install` completes without errors

---

### E03-F03: Admin Agent Project Scaffolding

| Field | Value |
|-------|-------|
| **ID** | E03-F03 |
| **Epic** | E-03 |
| **Release** | Foundation |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 3 |
| **Status** | Done |

**Description:**
As a developer, I want a scaffolded Hono project with dockerode so that I have a foundation for building the Docker management sidecar.

**Acceptance Criteria:**
- [x] `admin-agent/` directory contains a Hono TypeScript project
- [x] `dockerode` listed as a dependency
- [x] Source structure with `src/` entry point, route stubs, and middleware directory
- [x] Dockerfile present
- [x] `npm install` completes without errors

---

### E03-F04: Shared Type Library

| Field | Value |
|-------|-------|
| **ID** | E03-F04 |
| **Epic** | E-03 |
| **Release** | Foundation |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 2 |
| **Status** | Done |

**Description:**
As a developer, I want shared TypeScript types and constants in a common location so that the Portal and Admin Agent use consistent data structures and validation rules.

**Acceptance Criteria:**
- [x] `shared/ts/` directory with `types.ts` and `index.ts`
- [x] `RESERVED_USERNAMES` list includes `dev` and `login`
- [x] No Python cross-references remain in shared code

---

### E03-F05: Local Development Stack

| Field | Value |
|-------|-------|
| **ID** | E03-F05 |
| **Epic** | E-03 |
| **Release** | Foundation |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 8 |
| **Status** | Done |

**Description:**
As a developer, I want a Docker Compose stack that runs the full local development environment with real B2C authentication so that I can develop and test the portal without mocking auth flows.

**Acceptance Criteria:**
- [x] `docker-compose.yml` defines four services: `oauth2-proxy`, `portal`, `admin-agent`, `token-proxy`
- [x] OAuth2-Proxy configured with B2C-specific settings:
  - `OAUTH2_PROXY_OIDC_EMAIL_CLAIM=emails` (B2C uses `emails` array)
  - `OAUTH2_PROXY_INSECURE_OIDC_ALLOW_UNVERIFIED_EMAIL=true` (B2C omits `email_verified`)
  - `OAUTH2_PROXY_PASS_AUTHORIZATION_HEADER=true` (forwards ID token)
  - `OAUTH2_PROXY_SCOPE` includes the exposed API scope
  - `OAUTH2_PROXY_REDEEM_URL` routes through Token Proxy
- [x] Portal accessible at `localhost:3000` (proxied through OAuth2-Proxy at `localhost:4180`)
- [x] Admin Agent on `portal-net` network only (not exposed externally)
- [x] `docker compose build` succeeds for all services
- [x] `docker compose up` starts all four containers without errors

---

### E03-F06: B2C Token Exchange Compatibility

| Field | Value |
|-------|-------|
| **ID** | E03-F06 |
| **Epic** | E-03 |
| **Release** | Foundation |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 5 |
| **Status** | Done |

**Description:**
As a developer, I want a sidecar that fixes the B2C token exchange incompatibility so that OAuth2-Proxy can successfully obtain access tokens from Azure AD B2C.

**Acceptance Criteria:**
- [x] `token-proxy/proxy.js` intercepts token exchange requests from OAuth2-Proxy
- [x] Token Proxy appends the `scope` parameter to the POST body (required by B2C but omitted by OAuth2-Proxy's Go oauth2 library)
- [x] Token Proxy forwards the modified request to the B2C token endpoint
- [x] OAuth2-Proxy receives a valid `access_token` in the response
- [x] Dev B2C app registration has **Expose an API** configured with scope `access_as_user`
- [x] Dev B2C app registration has redirect URI `http://localhost:4180/oauth2/callback`

---

### E03-F07: End-to-End Auth Verification

| Field | Value |
|-------|-------|
| **ID** | E03-F07 |
| **Epic** | E-03 |
| **Release** | Foundation |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 3 |
| **Status** | Done |

**Description:**
As a developer, I want to verify that the complete authentication flow works end-to-end locally so that I can be confident the auth infrastructure is correct before building features on top of it.

**Acceptance Criteria:**
- [x] `http://localhost:4180` redirects to B2C login page
- [x] After B2C login, user is redirected back to Portal (Next.js page loads)
- [x] `X-Auth-Request-Access-Token` header present on Portal requests
- [x] Decoded JWT contains custom B2C attributes (`extension_..._Status`, `extension_..._Role`)
- [x] `/api/me` debug endpoint decodes both access token and ID token for claim inspection
- [x] Custom attributes appear in JWT when values are set via `scripts/b2c-set-user.ps1`
- [x] ID token carries custom attributes (via B2C user flow "Application claims")
- [x] No mock-auth or FastAPI containers running
