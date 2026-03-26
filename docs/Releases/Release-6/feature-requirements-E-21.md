# Feature Requirements — E-21: Documentation & E2E Verification

> Make the platform usable without tribal knowledge and prove it works end-to-end in both environments. User and admin guides ensure onboarding is self-serve, and systematic verification confirms the system behaves as documented.

| Field | Value |
|-------|-------|
| **Epic** | E-21 |
| **Release** | R6 — Polish & Production Readiness |
| **Status** | Backlog |

---

## Feature Summary

| ID | Title | Type | Priority | SP | Status |
|----|-------|------|----------|----|--------|
| E21-F01 | User Guide | Non-Functional | Must | 5 | Backlog |
| E21-F02 | Admin Operations Guide | Non-Functional | Must | 5 | Backlog |
| E21-F03 | DEV Environment E2E Verification | Non-Functional | Must | 5 | Backlog |
| E21-F04 | Production E2E Verification | Non-Functional | Must | 5 | Backlog |
| E21-F05 | Handoff Document Updates | Non-Functional | Should | 3 | Backlog |

**Total Story Points: 23**

---

## Features

### E21-F01: User Guide

| Field | Value |
|-------|-------|
| **ID** | E21-F01 |
| **Epic** | E-21 |
| **Release** | R6 |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As a new user, I want a clear guide explaining how to set up and use my account so that I can get started with my AI agent without needing to ask for help.

**Acceptance Criteria:**
- [ ] Covers the full user journey: sign-up, approval wait, onboarding, dashboard, launching the agent
- [ ] Explains what each dashboard element shows (agent status, resource usage, uptime)
- [ ] Documents how to restart or stop the agent
- [ ] Includes screenshots or annotated diagrams of key screens
- [ ] Written in plain language (no assumed technical knowledge)
- [ ] Published as a Markdown file in the repo (e.g., `docs/guides/user-guide.md`)

---

### E21-F02: Admin Operations Guide

| Field | Value |
|-------|-------|
| **ID** | E21-F02 |
| **Epic** | E-21 |
| **Release** | R6 |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As a platform admin, I want a guide documenting all administrative workflows so that I can manage users and monitor the system confidently.

**Acceptance Criteria:**
- [ ] Covers the approval workflow: reviewing pending users, approving, rejecting
- [ ] Documents user management: viewing all users, revoking access, soft delete
- [ ] Documents system monitoring: interpreting system status, resource thresholds
- [ ] Explains what happens behind the scenes during provisioning and de-provisioning
- [ ] Includes guidance on common operational scenarios (user can't log in, agent stuck, etc.)
- [ ] Published as a Markdown file in the repo (e.g., `docs/guides/admin-guide.md`)

---

### E21-F03: DEV Environment E2E Verification

| Field | Value |
|-------|-------|
| **ID** | E21-F03 |
| **Epic** | E-21 |
| **Release** | R6 |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As the project team, I want a systematic E2E test run on the DEV environment so that every user-facing flow is confirmed working before the final production release.

**Acceptance Criteria:**
- [ ] Full user lifecycle verified: sign-up → pending → approve → onboarding → dashboard → launch agent
- [ ] Admin workflows verified: pending queue, approve, reject, revoke, user detail view
- [ ] Subdomain validation verified: user A cannot access user B's subdomain
- [ ] Email notifications verified: admin receives new-user email, user receives approval/revocation emails
- [ ] Error handling verified: invalid username, provisioning failure, auth errors show correct pages
- [ ] Test results documented with pass/fail per test case

---

### E21-F04: Production E2E Verification

| Field | Value |
|-------|-------|
| **ID** | E21-F04 |
| **Epic** | E-21 |
| **Release** | R6 |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As the project team, I want to repeat the E2E verification on production so that we are confident the live environment matches DEV behaviour and is ready for real users.

**Acceptance Criteria:**
- [ ] Same test cases as E21-F03, executed on `*.teamhitori.com`
- [ ] 10 concurrent users running without performance degradation
- [ ] TLS certificates valid for all accessed subdomains
- [ ] Landing page at `teamhitori.com` loads correctly (CDN, not affected by portal)
- [ ] Email delivery (MX records) still functional
- [ ] Test results documented and compared with DEV results

---

### E21-F05: Handoff Document Updates

| Field | Value |
|-------|-------|
| **ID** | E21-F05 |
| **Epic** | E-21 |
| **Release** | R6 |
| **Type** | Non-Functional |
| **Priority** | Should |
| **Story Points** | 3 |
| **Status** | Backlog |

**Description:**
As a future developer or AI agent picking up this project, I want all handoff documents to reflect the final state of the system so that I have accurate context to continue work.

**Acceptance Criteria:**
- [ ] `docs/AGENT_HANDOFF.md` updated with final component statuses (all phases complete)
- [ ] `docs/ARCHITECTURE.md` reviewed for accuracy against implemented system
- [ ] `docs/ROADMAP.md` updated with all phases marked complete
- [ ] Feature requirements docs updated with final statuses (Done for completed features)
- [ ] Any known issues or tech debt documented
- [ ] "How to Resume" section updated with current operational state
