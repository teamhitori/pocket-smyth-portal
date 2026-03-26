# Feature Requirements — E-20: CI/CD Pipeline

> Replace manual deployments with an automated, repeatable pipeline — every code change is linted, built, tested, and shipped consistently, with a manual gate protecting production from untested changes.

> **Scope note:** This file covers the **portal application portion** of E-20 (GitHub Actions workflow, Docker image build, pipeline definition). The deployment target (VM SSH access, `docker compose pull/up` on the server) is owned by `logic-agent-platform`.

| Field | Value |
|-------|-------|
| **Epic** | E-20 |
| **Release** | R6 — Polish & Production Readiness |
| **Status** | Backlog |

---

## Feature Summary

| ID | Title | Type | Priority | SP | Status |
|----|-------|------|----------|----|--------|
| E20-F01 | GitHub Actions Build Pipeline | Non-Functional | Must | 5 | Backlog |
| E20-F02 | Staged Deployment Pipeline | Non-Functional | Must | 5 | Backlog |

**Total Story Points: 10**

---

## Features

### E20-F01: GitHub Actions Build Pipeline

| Field | Value |
|-------|-------|
| **ID** | E20-F01 |
| **Epic** | E-20 |
| **Release** | R6 |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As a developer, I want every push to the repository to automatically run lint, build, and test so that broken code is caught before it reaches any environment.

**Acceptance Criteria:**
- [ ] GitHub Actions workflow triggered on push to `main` and on pull requests
- [ ] Pipeline stages (in order): lint → build → test
- [ ] Lint: runs ESLint across `portal/` and `admin-agent/`
- [ ] Build: compiles TypeScript and builds Next.js production bundle
- [ ] Build: builds Portal and Admin Agent Docker images
- [ ] Test: runs any existing unit/integration tests
- [ ] Pipeline fails fast on first error (no wasted CI minutes)
- [ ] Build artifacts: Docker images pushed to a container registry (GitHub Container Registry or Docker Hub)
- [ ] Pipeline completes in under 5 minutes for a typical change

---

### E20-F02: Staged Deployment Pipeline

| Field | Value |
|-------|-------|
| **ID** | E20-F02 |
| **Epic** | E-20 |
| **Release** | R6 |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As the operations team, I want an automated deployment to DEV after a successful build, with a manual approval gate before deploying to production, so that changes are verified on DEV before reaching real users.

**Acceptance Criteria:**
- [ ] On merge to `main`: images auto-deployed to DEV environment
- [ ] Deployment to DEV: SSH to VM, `docker compose pull && docker compose up -d` (or equivalent)
- [ ] Manual approval step required before PROD deployment (GitHub Environments protection rules)
- [ ] PROD deployment uses the same images that were verified on DEV
- [ ] Deployment includes a post-deploy health check (hit `/api/health`, verify 200)
- [ ] Rollback documented: re-deploy previous image tag if health check fails
- [ ] Deployment secrets (SSH keys, registry credentials) stored in GitHub Secrets, not in code
