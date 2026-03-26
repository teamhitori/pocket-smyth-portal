# Feature Requirements — E-14: Provisioning Integration & DEV Verification

> Wire the individual components into a seamless end-to-end flow — when an admin approves a user and that user completes onboarding, the system should automatically provision their agent environment without manual intervention. This epic is the integration glue that turns separate pieces into a single product.

> **Scope note:** This file covers the **portal application portion** of E-14. Infrastructure concerns (Docker socket access policy, `portal-net` network on VM, user stack template deployment) are owned by `logic-agent-platform`.

| Field | Value |
|-------|-------|
| **Epic** | E-14 |
| **Release** | R3 — Admin + Provisioning on DEV |
| **Status** | Backlog |

---

## Feature Summary

| ID | Title | Type | Priority | SP | Status |
|----|-------|------|----------|----|--------|
| E14-F01 | User Provisioning Orchestration | Functional | Must | 8 | Backlog |
| E14-F02 | User De-provisioning Orchestration | Functional | Must | 5 | Backlog |
| E14-F03 | B2C Lifecycle Status Transitions | Functional | Must | 5 | Backlog |
| E14-F04 | Multi-User DEV Verification | Non-Functional | Must | 8 | Backlog |

**Total Story Points: 26**

---

## Features

### E14-F01: User Provisioning Orchestration

| Field | Value |
|-------|-------|
| **ID** | E14-F01 |
| **Epic** | E-14 |
| **Release** | R3 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 8 |
| **Status** | Backlog |

**Description:**
As the portal, I want to coordinate the full provisioning flow — from admin approval through onboarding to a running agent — so that when a user completes their setup, their personal AI environment is ready without any manual intervention.

**Acceptance Criteria:**
- [ ] Admin clicks **Approve** → API route updates B2C status to `approved` via Graph API
- [ ] Approved user logs in → middleware routes to `/onboarding` (per E-09)
- [ ] User completes onboarding (username + phone) → API route:
  1. Writes username to B2C via Graph API
  2. Calls Admin Agent `POST /compose/up` with `{ username }`
  3. Receives allocated port from Admin Agent
  4. Updates B2C: `status=active`, `containerPort=<port>`
- [ ] Provisioning is synchronous (caller waits for completion, per AD-12)
- [ ] If any step fails, error is returned to the user with clear messaging
- [ ] No partial state: if provisioning fails after B2C update, status is rolled back
- [ ] User is redirected to `{username}.teamhitori.com` on success

---

### E14-F02: User De-provisioning Orchestration

| Field | Value |
|-------|-------|
| **ID** | E14-F02 |
| **Epic** | E-14 |
| **Release** | R3 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As an admin, I want the revoke action to automatically stop the user's agent and remove their routing so that revoking access is a single-click operation that cleanly deactivates everything.

**Acceptance Criteria:**
- [ ] Admin clicks **Revoke** → API route:
  1. Calls Admin Agent `POST /compose/down` with `{ username }`
  2. Admin Agent stops the container and removes the Traefik route
  3. Updates B2C: `status=revoked`
- [ ] Container is stopped but data volumes are preserved (per AD-4)
- [ ] User's subdomain no longer routes to anything after revocation
- [ ] If the container is already stopped, the operation succeeds gracefully
- [ ] Revoked user sees the `/revoked` page on next login attempt (per E-09)

---

### E14-F03: B2C Lifecycle Status Transitions

| Field | Value |
|-------|-------|
| **ID** | E14-F03 |
| **Epic** | E-14 |
| **Release** | R3 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As the portal, I want every lifecycle transition to be reflected accurately in B2C so that the user's JWT always contains the correct status and the middleware routes them to the right experience.

**Acceptance Criteria:**
- [ ] All status transitions update B2C via Graph API:
  - `pending` → `approved` (admin approve)
  - `approved` → `active` (onboarding complete + provisioned)
  - `active` → `revoked` (admin revoke)
  - `pending` → `revoked` (admin reject)
- [ ] Username written to B2C `extension_..._Username` during onboarding
- [ ] Container port written to B2C `extension_..._ContainerPort` during provisioning
- [ ] Status changes are atomic — no intermediate states visible to the user
- [ ] Graph API errors during transitions are handled with retry logic or clear error reporting
- [ ] Updated claims appear in the user's next JWT (after re-login or token refresh)

---

### E14-F04: Multi-User DEV Verification

| Field | Value |
|-------|-------|
| **ID** | E14-F04 |
| **Epic** | E-14 |
| **Release** | R3 |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 8 |
| **Status** | Backlog |

**Description:**
As the project team, I want to verify the complete provisioning and de-provisioning flow with 3 real test users on the DEV environment so that we have confidence the system works before heading to production.

**Acceptance Criteria:**
- [ ] 2–3 test users created in B2C with different statuses (`pending`, `active`, `revoked`)
- [ ] Full provisioning flow verified on `*.dev.teamhitori.com`:
  - Pending user sees `/pending` page
  - Admin approves → user completes onboarding → agent provisioned → dashboard loads
  - User launches agent → Agent Zero opens in new tab at `{user}.dev.teamhitori.com/agent/`
- [ ] 3 users running simultaneously with no interference between agents
- [ ] Each user can only access their own subdomain (subdomain validation working)
- [ ] Admin can see and manage all users from `/admin/*`
- [ ] Full de-provisioning verified: admin revokes → container stopped → route removed → user sees `/revoked`
- [ ] No resource contention issues with 3 concurrent users on the Hetzner VM
