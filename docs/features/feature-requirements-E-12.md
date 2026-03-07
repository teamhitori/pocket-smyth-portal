# Feature Requirements — E-12: Admin Panel & User Management

> Give platform administrators full visibility and control over the user base — an operational interface to approve sign-ups, manage users, and monitor the system, replacing manual scripts with a proper UI.

| Field | Value |
|-------|-------|
| **Epic** | E-12 |
| **Release** | R3 — Admin + Provisioning on DEV |
| **Status** | Backlog |

---

## Feature Summary

| ID | Title | Type | Priority | SP | Status |
|----|-------|------|----------|----|--------|
| E12-F01 | Admin Layout & Navigation | Functional | Must | 5 | Backlog |
| E12-F02 | Pending Users Queue | Functional | Must | 5 | Backlog |
| E12-F03 | User Management Table | Functional | Must | 5 | Backlog |
| E12-F04 | User Detail View | Functional | Must | 5 | Backlog |
| E12-F05 | System Status Dashboard | Functional | Should | 5 | Backlog |
| E12-F06 | Admin API Routes | Functional | Must | 8 | Backlog |
| E12-F07 | Graph API Client | Functional | Must | 5 | Backlog |
| E12-F08 | Username Validation Service | Functional | Must | 3 | Backlog |

**Total Story Points: 41**

---

## Features

### E12-F01: Admin Layout & Navigation

| Field | Value |
|-------|-------|
| **ID** | E12-F01 |
| **Epic** | E-12 |
| **Release** | R3 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As an admin, I want a dedicated admin section with its own navigation so that I can manage the platform separately from my personal dashboard, with quick access to all administrative functions.

**Acceptance Criteria:**
- [ ] Admin section accessible at `{username}.teamhitori.com/admin/*`
- [ ] Only visible and accessible to users with `role=admin` in their JWT
- [ ] Non-admin users accessing `/admin/*` receive a 403 or redirect to their dashboard
- [ ] Sidebar navigation with links: Pending Users, All Users, System Status
- [ ] Pending count badge on the "Pending Users" nav link
- [ ] Shares the portal header (branding, user menu, logout) with the main dashboard
- [ ] "Back to Dashboard" link returns to the user's personal dashboard

---

### E12-F02: Pending Users Queue

| Field | Value |
|-------|-------|
| **ID** | E12-F02 |
| **Epic** | E-12 |
| **Release** | R3 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As an admin, I want to see a list of users waiting for approval with action buttons so that I can quickly review and approve or reject new sign-ups.

**Acceptance Criteria:**
- [ ] Page at `/admin/pending`
- [ ] Lists all users with `status=pending`, ordered by sign-up date (newest first)
- [ ] Each row shows: display name, email, sign-up date, identity provider
- [ ] **Approve** button per user → calls `POST /api/users/:id/approve`
- [ ] **Reject** button per user → calls `POST /api/users/:id/reject` (with confirmation dialog)
- [ ] Optimistic UI update after action (row removed from pending list)
- [ ] Empty state message when no users are pending
- [ ] Pending count in nav badge updates after approve/reject

---

### E12-F03: User Management Table

| Field | Value |
|-------|-------|
| **ID** | E12-F03 |
| **Epic** | E-12 |
| **Release** | R3 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As an admin, I want a searchable, filterable table of all platform users so that I can get a full picture of the user base and take bulk or individual actions.

**Acceptance Criteria:**
- [ ] Page at `/admin/users`
- [ ] Tabular list showing: username, display name, email, status, role, created date
- [ ] Filter by status (pending, approved, active, revoked)
- [ ] Search by username or email
- [ ] Action dropdown per user: View Detail, Revoke, Soft Delete
- [ ] Revoke action calls `POST /api/users/:id/revoke` (with confirmation dialog)
- [ ] Soft delete action calls `DELETE /api/users/:id` (with confirmation dialog)
- [ ] Pagination or virtual scrolling for large user lists (post-MVP consideration)

---

### E12-F04: User Detail View

| Field | Value |
|-------|-------|
| **ID** | E12-F04 |
| **Epic** | E-12 |
| **Release** | R3 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As an admin, I want to view a single user's full profile and agent status so that I can diagnose issues, check resource usage, and take targeted actions like restarting their agent.

**Acceptance Criteria:**
- [ ] Page at `/admin/users/:id`
- [ ] Displays: user info (name, email, username, status, role, sign-up date)
- [ ] Displays: agent container status (running/stopped, uptime, CPU, memory)
- [ ] Agent data fetched via `GET /api/me/agent`-equivalent admin route
- [ ] Action buttons: Restart Agent, Stop Agent, Revoke Access
- [ ] Restart calls Admin Agent via portal API
- [ ] Status changes reflected after action (polling or refetch)

---

### E12-F05: System Status Dashboard

| Field | Value |
|-------|-------|
| **ID** | E12-F05 |
| **Epic** | E-12 |
| **Release** | R3 |
| **Type** | Functional |
| **Priority** | Should |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As an admin, I want a system-level overview of the platform's resource usage so that I can monitor capacity and identify when the platform is approaching its limits.

**Acceptance Criteria:**
- [ ] Page at `/admin/system`
- [ ] Shows VM-level metrics: CPU, RAM, and disk usage
- [ ] Shows platform metrics: total containers, running containers, allocated ports
- [ ] Data sourced from Admin Agent (`GET /api/system/status`)
- [ ] Visual indicators for resource thresholds (warning/critical levels)
- [ ] Auto-refresh or manual refresh button

---

### E12-F06: Admin API Routes

| Field | Value |
|-------|-------|
| **ID** | E12-F06 |
| **Epic** | E-12 |
| **Release** | R3 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 8 |
| **Status** | Backlog |

**Description:**
As an admin, I want backend API endpoints for all user management operations so that the admin panel has reliable, secure endpoints for every administrative action.

**Acceptance Criteria:**
- [ ] `GET /api/users` — lists all users from B2C via Graph API
  - Supports `?status=` filter query parameter
  - Returns: id, displayName, email, username, status, role, createdDateTime
- [ ] `POST /api/users/:id/approve` — updates user status to `approved` in B2C
  - Triggers Graph API update to set `extension_..._Status=approved`
  - Returns success with updated user object
- [ ] `POST /api/users/:id/reject` — updates user status to `revoked` in B2C
  - Returns success with updated user object
- [ ] `POST /api/users/:id/revoke` — revokes an active user
  - Updates B2C status to `revoked`
  - Calls Admin Agent to stop user's container
  - Returns success with updated user object
- [ ] `DELETE /api/users/:id` — soft delete (flag-based, per AD-4)
  - Sets status to `revoked`, stops container, preserves data
  - Does NOT delete user from B2C or remove data volumes
- [ ] `GET /api/system/status` — returns platform resource overview
  - CPU, memory, disk at VM level
  - Container count, running count, port allocation
  - Calls Admin Agent internally
- [ ] `GET /api/system/config` — returns system configuration
- [ ] All admin routes require `role=admin` in JWT (403 otherwise)
- [ ] All routes return consistent JSON error responses
- [ ] Request logging for all admin actions (action, target user, timestamp)

---

### E12-F07: Graph API Client

| Field | Value |
|-------|-------|
| **ID** | E12-F07 |
| **Epic** | E-12 |
| **Release** | R3 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As the portal backend, I want a reusable Graph API client so that all routes can read and write B2C user attributes consistently without duplicating authentication and API call logic.

**Acceptance Criteria:**
- [ ] TypeScript module that authenticates to Microsoft Graph using client credentials (`B2C_GRAPH_CLIENT_ID` + `B2C_GRAPH_CLIENT_SECRET`)
- [ ] Functions to:
  - List all users with extension attributes
  - Get a single user by object ID
  - Update extension attributes (Status, Role, Username, ContainerPort)
  - Check username uniqueness across all users
- [ ] Handles token caching and refresh (client credentials grant)
- [ ] Auto-discovers extension property names from the b2c-extensions-app (no hardcoded attribute names, matching the approach in `scripts/b2c-get-user.ps1`)
- [ ] Includes error handling for Graph API failures (rate limits, not found, unauthorized)
- [ ] Shared between user API routes and admin API routes

---

### E12-F08: Username Validation Service

| Field | Value |
|-------|-------|
| **ID** | E12-F08 |
| **Epic** | E-12 |
| **Release** | R3 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 3 |
| **Status** | Backlog |

**Description:**
As the portal, I want a centralised username validation service so that the onboarding wizard and admin operations enforce consistent naming rules everywhere.

**Acceptance Criteria:**
- [ ] Validates username format: alphanumeric + hyphens, 4–10 characters, lowercase only (per AD-7)
- [ ] Blocks reserved words: `admin`, `app`, `www`, `api`, `mail`, `portal`, `system`, `root`, `public`, `static`, `login`, `dev`
- [ ] Applies a profanity filter
- [ ] Checks uniqueness against existing usernames in B2C (via Graph API client)
- [ ] Returns specific error codes/messages for each validation failure type
- [ ] Usable from both the onboarding API route and admin API routes
